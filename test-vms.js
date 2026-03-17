const vmware = require('./services/vmwareService');
const path = require('path');

async function test() {
  console.log('--- VMware Inventory & List Test ---');
  const vms = await vmware.listVMs();
  console.log(`Found ${vms.length} VMs (after filtering)`);
  
  vms.forEach(vm => {
    console.log(`- [${vm.id}] Name: ${vm.name}, State: ${vm.state}, Path: ${vm.path}`);
  });
  
  console.log('\n--- Normalization Check ---');
  function normalizePath(p) {
    if (!p) return '';
    return path.resolve(p).toLowerCase().replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  }
  
  const test1 = 'D:\\Virtual Machines\\VM_ZABBIX\\VM_ZABBIX.vmx';
  const test2 = 'd:/virtual machines/vm_zabbix/vm_zabbix.vmx';
  console.log(`Path 1: ${test1} -> ${normalizePath(test1)}`);
  console.log(`Path 2: ${test2} -> ${normalizePath(test2)}`);
  console.log(`Match? ${normalizePath(test1) === normalizePath(test2)}`);
}

test();
