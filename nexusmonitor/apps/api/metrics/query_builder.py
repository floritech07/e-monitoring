class PromQLToSQLBuilder:
    """
    Translates basic subset of PromQL expressions to SQL suitable for TimescaleDB.
    (Subset for evaluating alerts efficiently over metrics without bringing data to memory)
    """
    @staticmethod
    def build_threshold_query(metric_id: str, condition: str, value: float, interval_sec: int) -> str:
        """
        Builds SQL to check if metric violated condition over the last N seconds.
        """
        # Condition should be safely enumerated (>, <, >=, <=, ==)
        safe_conditions = {
            ">": ">", "<": "<", ">=": ">=", "<=": "<=", "==": "="
        }
        op = safe_conditions.get(condition, ">")
        
        # In actual system, parameterize the values
        query = f"""
        SELECT COUNT(*)
        FROM metric_points
        WHERE series_id = :series_id
          AND ts >= NOW() - INTERVAL '{interval_sec} seconds'
          AND value {op} :threshold
        """
        return query
