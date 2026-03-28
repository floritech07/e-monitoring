const mysql = require('mysql2/promise');
const alertsService = require('./alertRulesService');
const activityService = require('./activityService');

// DB Credentials from .env
const PREPAID_DB = {
  host:     process.env.DB_PREPAID_HOST || '127.0.0.1',
  user:     process.env.DB_PREPAID_USER || 'root',
  password: process.env.DB_PREPAID_PASSWORD || '',
  database: process.env.DB_PREPAID_NAME || 'smartvend'
};

const POSTPAID_DB = {
  host:     process.env.DB_POSTPAID_HOST || '127.0.0.1',
  user:     process.env.DB_POSTPAID_USER || 'root',
  password: process.env.DB_POSTPAID_PASSWORD || '',
  database: process.env.DB_POSTPAID_NAME || 'middleware_prod'
};

let prepaidPool = null;
let postpaidPool = null;

async function getPrepaidPool() {
  if (!prepaidPool) {
    prepaidPool = mysql.createPool(PREPAID_DB);
  }
  return prepaidPool;
}

async function getPostpaidPool() {
  if (!postpaidPool) {
    postpaidPool = mysql.createPool(POSTPAID_DB);
  }
  return postpaidPool;
}

async function getPrepaidStats(operator, intervalMinutes = 60) {
  try {
    const pool = await getPrepaidPool();
    const sql = `
      SELECT 
        SUM(CASE WHEN venddate >= NOW() - INTERVAL ? MINUTE THEN 1 ELSE 0 END) as current_count,
        SUM(CASE WHEN venddate < NOW() - INTERVAL ? MINUTE AND venddate >= NOW() - INTERVAL ? MINUTE THEN 1 ELSE 0 END) as previous_count
      FROM smartvend.bz_meter_vend 
      WHERE coperator = ?
    `;
    const [rows] = await pool.execute(sql, [intervalMinutes, intervalMinutes, intervalMinutes * 2, operator]);
    return rows[0];
  } catch (err) {
    console.error(`[Prepaid Stats Error] ${operator}:`, err.message);
    return { current_count: 0, previous_count: 0 };
  }
}

async function getPostpaidStats(operator, intervalMinutes = 60) {
  try {
    const pool = await getPostpaidPool();
    let tiers = [operator];
    if (operator === 'ASIN') tiers = ['PNPE', 'NPEP'];
    else if (operator === 'BANQUES') tiers = ['BSIC', 'UBAB', 'ECOB'];

    const placeholders = tiers.map(() => '?').join(',');
    const sql = `
      SELECT 
        SUM(CASE WHEN created_at >= NOW() - INTERVAL ? MINUTE THEN 1 ELSE 0 END) as current_count,
        SUM(CASE WHEN created_at < NOW() - INTERVAL ? MINUTE AND created_at >= NOW() - INTERVAL ? MINUTE THEN 1 ELSE 0 END) as previous_count
      FROM historique_transactions_in
      WHERE tiers IN (${placeholders})
    `;
    const [rows] = await pool.execute(sql, [intervalMinutes, intervalMinutes, intervalMinutes * 2, ...tiers]);
    return rows[0];
  } catch (err) {
    console.error(`[Postpaid Stats Error] ${operator}:`, err.message);
    return { current_count: 0, previous_count: 0 };
  }
}

let lastEvaluation = Date.now();
const THRESHOLD_PERCENT = 30;

async function evaluateTransactions() {
  const operatorsPrefix = ['MOOV', 'MTN', 'SBIN', 'ASIN'];
  const operatorsPostfix = ['ASIN', 'MTN', 'MOOV', 'SBIN', 'BANQUES', 'PERFORM'];

  for (const op of operatorsPrefix) {
    const stats = await getPrepaidStats(op);
    checkAndAlert('PREPAID', op, stats);
  }

  for (const op of operatorsPostfix) {
    const stats = await getPostpaidStats(op);
    checkAndAlert('POSTPAID', op, stats);
  }

  lastEvaluation = Date.now();
}

function checkAndAlert(type, operator, stats) {
  const { current_count, previous_count } = stats;
  if (previous_count >= 10 && current_count < previous_count * (1 - THRESHOLD_PERCENT / 100)) {
    const drop = Math.round((1 - current_count / previous_count) * 100);
    alertsService.addExternalAlert({
      level: 'critical', severity: 'critical', category: 'payment',
      message: `Baisse de ${drop}% des transactions ${type} pour l'opérateur ${operator} (Actuel: ${current_count}, Précédent: ${previous_count})`,
      source: `${type}_${operator}`, ruleId: `payment_drop_${type}_${operator}`
    });
    activityService.log('error', `Alerte baisse transactions: ${type} ${operator} (-${drop}%)`, 'Payment Monitor');
  }
}

async function getTrends(intervalMinutes = 60) {
  const operatorsPrefix = ['MOOV', 'MTN', 'SBIN', 'ASIN'];
  const operatorsPostfix = ['ASIN', 'MTN', 'MOOV', 'SBIN', 'BANQUES', 'PERFORM'];
  const summary = [];

  for (const op of operatorsPrefix) {
    const stats = await getPrepaidStats(op, intervalMinutes);
    summary.push({ 
      operator: op, type: 'PREPAID', 
      current: stats.current_count, previous: stats.previous_count,
      change: stats.previous_count > 0 ? Math.round(((stats.current_count - stats.previous_count) / stats.previous_count) * 100) : 0
    });
  }

  for (const op of operatorsPostfix) {
    const stats = await getPostpaidStats(op, intervalMinutes);
    summary.push({ 
      operator: op, type: 'POSTPAID', 
      current: stats.current_count, previous: stats.previous_count,
      change: stats.previous_count > 0 ? Math.round(((stats.current_count - stats.previous_count) / stats.previous_count) * 100) : 0
    });
  }

  return { lastUpdate: lastEvaluation, summary, intervalMinutes };
}

async function getPrepaidTrend(range = '1h') {
  try {
    const pool = await getPrepaidPool();
    const operators = ['MOOV', 'MTN', 'SBIN', 'ASIN'];
    
    let interval = '1 HOUR';
    if (range.endsWith('m')) interval = `${parseInt(range)} MINUTE`;
    else if (range.endsWith('h')) interval = `${parseInt(range)} HOUR`;
    else if (range.endsWith('d')) interval = `${parseInt(range)} DAY`;
    else if (range === 'yesterday') interval = '2 DAY';
    else if (range.endsWith('mo')) interval = `${parseInt(range)} MONTH`;
    else if (range.endsWith('y')) interval = `${parseInt(range)} YEAR`;

    let secondsDivisor = 60;
    const rangeVal = parseInt(range);
    if (range.endsWith('m') && rangeVal <= 15) secondsDivisor = 5;
    else if (range.endsWith('m') || (range.endsWith('h') && rangeVal === 1)) secondsDivisor = 30;

    const pResults = await Promise.all(operators.map(async op => {
      let filter = 'coperator = ?';
      let params = [op];
      if (op === 'ASIN') {
        filter = "coperator IN ('PNPE', 'NPEP')";
        params = [];
      }
      const sql = `
        SELECT 
          (UNIX_TIMESTAMP(venddate) - (UNIX_TIMESTAMP(venddate) % ${secondsDivisor})) * 1000 AS time,  
          COUNT(*) AS entry_count
        FROM smartvend.bz_meter_vend 
        WHERE ${filter}
          AND venddate >= NOW() - INTERVAL ${interval}
        GROUP BY time
        ORDER BY time
      `;
      const [rows] = await pool.execute(sql, params);
      return { operator: op, data: rows };
    }));
    return pResults;
  } catch (err) {
    console.error(`[Prepaid Trend Error]:`, err.message);
    return [];
  }
}

async function getPostpaidTrend(range = '1h') {
  try {
    const pool = await getPostpaidPool();
    const activeTiers = ['ASIN', 'MTN', 'MOOV', 'SBIN', 'BANQUES'];
    
    let interval = '1 HOUR';
    if (range.endsWith('m')) interval = `${parseInt(range)} MINUTE`;
    else if (range.endsWith('h')) interval = `${parseInt(range)} HOUR`;
    else if (range.endsWith('d')) interval = `${parseInt(range)} DAY`;
    else if (range === 'yesterday') interval = '2 DAY';
    else if (range.endsWith('mo')) interval = `${parseInt(range)} MONTH`;
    else if (range.endsWith('y')) interval = `${parseInt(range)} YEAR`;
    
    let secondsDivisor = 60;
    const rangeVal = parseInt(range);
    if (range.endsWith('m') && rangeVal <= 15) secondsDivisor = 5;
    else if (range.endsWith('m') || (range.endsWith('h') && rangeVal === 1)) secondsDivisor = 30;

    const pResults = await Promise.all(activeTiers.map(async tier => {
      let filter = 'hti.tiers = ?';
      let params = [tier];
      if (tier === 'ASIN') {
        filter = "hti.tiers IN ('PNPE', 'NPEP')";
        params = [];
      } else if (tier === 'BANQUES') {
        filter = "hti.tiers IN ('BSIC', 'UBAB', 'ECOB')";
        params = [];
      } else if (tier === 'MTN') {
        filter = "hti.tiers = 'MTNM'";
        params = ['MTNM'];
      }

      const sql = `
        SELECT 
          (UNIX_TIMESTAMP(hti.created_at) - (UNIX_TIMESTAMP(hti.created_at) % ${secondsDivisor})) * 1000 AS time,  
          COUNT(*) AS entry_count
        FROM historique_transactions_in hti
        JOIN historique_transactions_out hto ON hti.id = hto.histo_trans_in_id
        WHERE ${filter} AND hto.heure_reglement != ''
          AND hti.created_at >= NOW() - INTERVAL ${interval}
        GROUP BY time
        ORDER BY time
      `;
      const [rows] = await pool.execute(sql, params);
      return { tier, data: rows };
    }));

    const [performRows] = await pool.execute(`
      SELECT 
        (UNIX_TIMESTAMP(created_at) - (UNIX_TIMESTAMP(created_at) % ${secondsDivisor})) * 1000 AS time,  
        COUNT(*) AS entry_count
      FROM historique_transactions_out
      WHERE heure_reglement = ''
        AND created_at >= NOW() - INTERVAL ${interval}
      GROUP BY time
      ORDER BY time
    `);
    pResults.push({ tier: 'PERFORM', data: performRows });

    return pResults;
  } catch (err) {
    console.error(`[Postpaid Trend Error]:`, err.message);
    return [];
  }
}

module.exports = {
  evaluateTransactions,
  getTrends,
  getPrepaidStats,
  getPostpaidStats,
  getPrepaidTrend,
  getPostpaidTrend
};
