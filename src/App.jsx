import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ClipboardList, 
  Printer, 
  FileSpreadsheet, 
  Save, 
  Search,
  Plus,
  Minus,
  LayoutDashboard,
  ChefHat,
  Filter,
  Upload,
  Settings,
  Edit2,
  Trash2,
  X,
  Check
} from 'lucide-react';

// --- Mock Data (初始資料庫) ---
const INITIAL_CUSTOMERS = [
  { id: 'C001', name: '陳偉忠', address: '土瓜灣美景街安康大廈9樓I室', texture: '正', zone: 'A線', organization: '聖雅各福群會' },
  { id: 'C002', name: '李秀英', address: '土瓜灣美景街安康大廈4樓A室', texture: '碎', zone: 'A線', organization: '社署' },
  { id: 'C003', name: '張伯', address: '馬頭角道金都豪苑12樓C室', texture: '全糊', zone: 'B線', organization: '聖雅各福群會' },
  { id: 'C004', name: '王大文', address: '北帝街15號地下', texture: '正', zone: 'B線', organization: '長者中心' },
  { id: 'C005', name: '何妹', address: '木廠街3號2樓', texture: '分糊', zone: 'C線', organization: '社署' },
];

const ZONES = ['A線', 'B線', 'C線', 'D線', '特別線'];
const TEXTURES = ['正', '碎', '全糊', '分糊', '剪碎'];

export default function OrderSystem() {
  const [activeTab, setActiveTab] = useState('batch'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Database States
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState([]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('所有區域');
  const [isEditingCustomer, setIsEditingCustomer] = useState(null); // ID of customer being edited
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // 初始化訂單
  useEffect(() => {
    if (orders.length === 0) {
      const demoOrders = customers.map(c => ({
        id: `${selectedDate}-${c.id}`,
        date: selectedDate,
        customerId: c.id,
        qtyA: 0, qtyB: 0, qtyC: 0, notes: ''
      }));
      demoOrders[0].qtyA = 1; demoOrders[0].qtyB = 1;
      demoOrders[1].qtyC = 1;
      setOrders(demoOrders);
    }
  }, []);

  // --- 計算邏輯 ---
  const dailyOrders = useMemo(() => {
    return customers.map(customer => {
      const existingOrder = orders.find(o => o.date === selectedDate && o.customerId === customer.id);
      return existingOrder || {
        id: `${selectedDate}-${customer.id}`,
        date: selectedDate,
        customerId: customer.id,
        qtyA: 0, qtyB: 0, qtyC: 0, notes: ''
      };
    }).filter(order => {
      const customer = customers.find(c => c.id === order.customerId);
      const matchesSearch = customer.name.includes(searchTerm) || customer.address.includes(searchTerm);
      const matchesZone = selectedZone === '所有區域' || customer.zone === selectedZone;
      return matchesSearch && matchesZone;
    });
  }, [orders, selectedDate, customers, searchTerm, selectedZone]);

  const stats = useMemo(() => {
    return dailyOrders.reduce((acc, order) => {
      acc.A += (order.qtyA || 0);
      acc.B += (order.qtyB || 0);
      acc.C += (order.qtyC || 0);
      return acc;
    }, { A: 0, B: 0, C: 0 });
  }, [dailyOrders]);

  // --- Actions ---
  const handleUpdateOrder = (customerId, field, value) => {
    setOrders(prev => {
      const newOrders = [...prev];
      const existingIndex = newOrders.findIndex(o => o.date === selectedDate && o.customerId === customerId);
      
      if (existingIndex >= 0) {
        newOrders[existingIndex] = { ...newOrders[existingIndex], [field]: value };
      } else {
        newOrders.push({
          id: `${selectedDate}-${customerId}`,
          date: selectedDate,
          customerId,
          qtyA: 0, qtyB: 0, qtyC: 0, notes: '',
          [field]: value
        });
      }
      return newOrders;
    });
  };

  const handleSaveCustomer = () => {
    if (newCustomerMode) {
      const newId = `C${(customers.length + 1).toString().padStart(3, '0')}`;
      setCustomers([...customers, { ...editFormData, id: newId }]);
      setNewCustomerMode(false);
    } else {
      setCustomers(customers.map(c => c.id === isEditingCustomer ? { ...c, ...editFormData } : c));
      setIsEditingCustomer(null);
    }
    setEditFormData({});
  };

  const handleDeleteCustomer = (id) => {
    if (window.confirm('確定要刪除這位客人的資料嗎？這將會影響歷史訂單紀錄。')) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  const startEdit = (customer) => {
    setIsEditingCustomer(customer.id);
    setEditFormData({ ...customer });
  };

  const startNewCustomer = () => {
    setNewCustomerMode(true);
    setEditFormData({
      name: '', address: '', texture: '正', zone: 'A線', organization: ''
    });
  };

  const handleMassImport = () => {
    if (window.confirm('模擬：是否從 "agency_orders.csv" 匯入今日訂單？')) {
       setOrders(prev => {
         const newOrders = [...prev];
         customers.forEach(c => {
           const exists = newOrders.find(o => o.date === selectedDate && o.customerId === c.id);
           if (!exists) {
              newOrders.push({
                id: `${selectedDate}-${c.id}`,
                date: selectedDate,
                customerId: c.id,
                qtyA: Math.random() > 0.7 ? 1 : 0, 
                qtyB: Math.random() > 0.7 ? 1 : 0, 
                qtyC: 0, 
                notes: '匯入數據'
              });
           }
         });
         return newOrders;
       });
       alert('匯入成功！');
    }
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "訂單ID,日期,客人姓名,機構,區域,地址,餐類屬性,A餐,B餐,C餐,備註\n";

    // Export logic same as before...
    const allDailyOrders = customers.map(customer => {
        const existingOrder = orders.find(o => o.date === selectedDate && o.customerId === customer.id);
        return existingOrder || { customerId: customer.id, qtyA:0, qtyB:0, qtyC:0 };
    });

    allDailyOrders.forEach(order => {
      const customer = customers.find(c => c.id === order.customerId);
      if (order.qtyA > 0 || order.qtyB > 0 || order.qtyC > 0) {
        const row = [
          `${selectedDate}-${customer.id}`,
          selectedDate,
          customer.name,
          customer.organization,
          customer.zone,
          `"${customer.address}"`,
          customer.texture,
          order.qtyA || 0,
          order.qtyB || 0,
          order.qtyC || 0,
          order.notes || ''
        ].join(",");
        csvContent += row + "\n";
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WeCare訂單_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Views ---

  const Sidebar = () => (
    <div className="w-64 bg-slate-800 text-white flex flex-col h-full fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-orange-400" />
          WeCare 送餐
        </h1>
        <p className="text-slate-400 text-sm mt-2">Admin Dashboard</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <button onClick={() => setActiveTab('batch')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'batch' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
          <ClipboardList size={20} /> 每日訂單輸入
        </button>
        <button onClick={() => setActiveTab('labels')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'labels' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
          <Printer size={20} /> 打印送貨貼紙
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
          <LayoutDashboard size={20} /> 統計概覽
        </button>
        <div className="pt-4 mt-4 border-t border-slate-700">
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
            <Settings size={20} /> 客人資料管理
          </button>
        </div>
      </nav>
    </div>
  );

  const CustomerManagementView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users size={20} /> 客人資料庫
        </h2>
        <button onClick={startNewCustomer} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          <Plus size={18} /> 新增客人
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">基本資料</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">屬性</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600">機構 & 地址</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {newCustomerMode && (
               <tr className="bg-blue-50">
                 <td className="px-6 py-4 text-sm text-slate-500">Auto</td>
                 <td className="px-6 py-4">
                   <input className="w-full border p-1 rounded mb-1" placeholder="姓名" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                 </td>
                 <td className="px-6 py-4">
                    <select className="border p-1 rounded mr-1" value={editFormData.texture} onChange={e => setEditFormData({...editFormData, texture: e.target.value})}>
                      {TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select className="border p-1 rounded" value={editFormData.zone} onChange={e => setEditFormData({...editFormData, zone: e.target.value})}>
                      {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                 </td>
                 <td className="px-6 py-4">
                    <input className="w-full border p-1 rounded mb-1" placeholder="機構" value={editFormData.organization} onChange={e => setEditFormData({...editFormData, organization: e.target.value})} />
                    <input className="w-full border p-1 rounded" placeholder="地址" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                 </td>
                 <td className="px-6 py-4 text-right">
                    <button onClick={handleSaveCustomer} className="text-green-600 hover:bg-green-100 p-2 rounded"><Check size={18}/></button>
                    <button onClick={() => setNewCustomerMode(false)} className="text-red-600 hover:bg-red-100 p-2 rounded"><X size={18}/></button>
                 </td>
               </tr>
            )}

            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50">
                {isEditingCustomer === c.id ? (
                  <>
                    <td className="px-6 py-4 text-sm text-slate-500">{c.id}</td>
                    <td className="px-6 py-4">
                      <input className="w-full border p-1 rounded font-bold" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    </td>
                    <td className="px-6 py-4">
                        <select className="border p-1 rounded mr-1 mb-1 block w-full" value={editFormData.texture} onChange={e => setEditFormData({...editFormData, texture: e.target.value})}>
                          {TEXTURES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className="border p-1 rounded block w-full" value={editFormData.zone} onChange={e => setEditFormData({...editFormData, zone: e.target.value})}>
                          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </td>
                    <td className="px-6 py-4">
                        <input className="w-full border p-1 rounded mb-1" placeholder="機構" value={editFormData.organization} onChange={e => setEditFormData({...editFormData, organization: e.target.value})} />
                        <input className="w-full border p-1 rounded" placeholder="地址" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={handleSaveCustomer} className="text-green-600 hover:bg-green-100 p-2 rounded mr-2"><Check size={18}/></button>
                        <button onClick={() => setIsEditingCustomer(null)} className="text-slate-500 hover:bg-slate-100 p-2 rounded"><X size={18}/></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-slate-500">{c.id}</td>
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{c.name}</div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full mr-2 ${c.texture === '正' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{c.texture}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{c.zone}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs text-slate-500 mb-1">{c.organization}</div>
                        <div className="text-sm text-slate-600">{c.address}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => startEdit(c)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors mr-2">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Reuse previous components...
  const BatchEntryView = () => (
    <div className="space-y-6">
      {/* Search Bar & Filters */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">選擇日期</label>
                <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">區域篩選</label>
                <div className="relative">
                    <select 
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="appearance-none border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none bg-white min-w-[120px]"
                    >
                        <option value="所有區域">所有區域</option>
                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <Filter className="w-4 h-4 text-slate-400 absolute right-2 top-3 pointer-events-none" />
                </div>
            </div>
            <div className="relative">
                <label className="block text-xs font-medium text-slate-500 mb-1">搜尋客人</label>
                <input 
                type="text" 
                placeholder="輸入姓名或地址..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-300 rounded-lg pl-9 pr-3 py-2 w-56 text-slate-700 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-8" />
            </div>
            </div>
            
            <div className="flex gap-2">
                <button onClick={handleMassImport} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-200">
                    <Upload size={18} /> 匯入模擬
                </button>
                <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    <FileSpreadsheet size={18} /> 匯出 Excel
                </button>
            </div>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">目前列表統計:</span>
            <div className="flex gap-4">
                <span className="text-blue-600 font-bold text-sm">A餐: {stats.A}</span>
                <span className="text-orange-600 font-bold text-sm">B餐: {stats.B}</span>
                <span className="text-green-600 font-bold text-sm">C餐: {stats.C}</span>
            </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">客人資料</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center w-24">A餐 (魚)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center w-24">B餐 (肉)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center w-24">C餐 (素)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">備註</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyOrders.map((order) => {
                const customer = customers.find(c => c.id === order.customerId);
                const hasOrder = order.qtyA > 0 || order.qtyB > 0 || order.qtyC > 0;
                return (
                  <tr key={customer.id} className={`hover:bg-slate-50 transition-colors ${hasOrder ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-slate-900">{customer.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{customer.organization}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-bold">{customer.zone}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">{customer.address}</div>
                      <div className="mt-2 flex gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${customer.texture === '正' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{customer.texture}餐</span>
                      </div>
                    </td>
                    {['A', 'B', 'C'].map((type) => (
                      <td key={type} className="px-4 py-4 text-center">
                        <input type="number" min="0" value={order[`qty${type}`] || ''} placeholder="0" onChange={(e) => handleUpdateOrder(customer.id, `qty${type}`, parseInt(e.target.value) || 0)} className={`w-16 text-center border rounded-md py-2 focus:ring-2 focus:ring-orange-500 outline-none font-bold ${order[`qty${type}`] > 0 ? 'border-orange-500 bg-white text-orange-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`} />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <input type="text" placeholder="例：走蔥" value={order.notes} onChange={(e) => handleUpdateOrder(customer.id, 'notes', e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const LabelView = () => {
    // Reuse previous logic but with `customers` state
    const activeOrders = customers.map(customer => {
        const existingOrder = orders.find(o => o.date === selectedDate && o.customerId === customer.id);
        return existingOrder;
    }).filter(order => order && (order.qtyA > 0 || order.qtyB > 0 || order.qtyC > 0));

    const filteredLabels = activeOrders.filter(order => {
        const customer = customers.find(c => c.id === order.customerId);
        return selectedZone === '所有區域' || customer.zone === selectedZone;
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 no-print">
          <div>
            <h2 className="text-lg font-bold text-slate-800">標籤預覽 ({filteredLabels.length})</h2>
            <p className="text-sm text-slate-500">日期: {selectedDate} • 區域: {selectedZone}</p>
          </div>
          <div className="flex gap-4 items-center">
             <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 bg-white text-sm">
                <option value="所有區域">所有區域</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <Printer size={18} /> 列印標籤
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
          {filteredLabels.map(order => {
             const customer = customers.find(c => c.id === order.customerId);
             return (
               <div key={order.id} className="bg-white border-2 border-slate-300 p-4 rounded-lg shadow-sm relative break-inside-avoid print:border-black print:shadow-none">
                 <div className="text-center border-b-2 border-slate-200 pb-2 mb-2 print:border-black flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-500 border border-slate-300 px-1 rounded print:text-black print:border-black">{customer.zone}</span>
                    <h3 className="text-2xl font-bold text-slate-900 flex-1">{customer.name}</h3>
                    <span className="w-8"></span>
                 </div>
                 <div className="text-sm font-medium text-slate-600 mb-4 print:text-black min-h-[40px]">{customer.address}</div>
                 <div className="space-y-1 text-sm font-bold text-slate-800 print:text-black">
                    {order.qtyA > 0 && <div className="flex justify-between"><span>(A餐) 魚餐:</span> <span>{order.qtyA}</span></div>}
                    {order.qtyB > 0 && <div className="flex justify-between"><span>(B餐) 肉餐:</span> <span>{order.qtyB}</span></div>}
                    {order.qtyC > 0 && <div className="flex justify-between"><span>(C餐) 素餐:</span> <span>{order.qtyC}</span></div>}
                 </div>
                 {order.notes && <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-red-600 print:border-black">備註: {order.notes}</div>}
                 <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-slate-800 print:border-black print:text-black">{customer.texture.charAt(0)}</div>
                 </div>
               </div>
             );
          })}
        </div>
        <style>{`@media print { .no-print { display: none !important; } body { background: white; } .w-64 { display: none; } main { margin-left: 0 !important; padding: 0 !important; } }`}</style>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8 no-print">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'batch' && '每日訂單管理'}
              {activeTab === 'dashboard' && '今日數據統計'}
              {activeTab === 'labels' && '送貨標籤管理'}
              {activeTab === 'customers' && '客人資料庫'}
            </h2>
            <p className="text-slate-500">{new Date().toLocaleDateString('zh-HK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">A</div>
          </div>
        </header>

        {activeTab === 'batch' && <BatchEntryView />}
        {activeTab === 'labels' && <LabelView />}
        {activeTab === 'customers' && <CustomerManagementView />}
        
        {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl shadow-sm border border-slate-100 bg-white flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium mb-1">今日 A餐 (魚)</p><h3 className="text-3xl font-bold text-slate-800">{stats.A}</h3></div><div className="p-3 rounded-lg bg-blue-100 text-blue-600"><div className="font-bold text-xl">A</div></div></div>
              <div className="p-6 rounded-xl shadow-sm border border-slate-100 bg-white flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium mb-1">今日 B餐 (肉)</p><h3 className="text-3xl font-bold text-slate-800">{stats.B}</h3></div><div className="p-3 rounded-lg bg-orange-100 text-orange-600"><div className="font-bold text-xl">B</div></div></div>
              <div className="p-6 rounded-xl shadow-sm border border-slate-100 bg-white flex justify-between items-start"><div><p className="text-slate-500 text-sm font-medium mb-1">今日 C餐 (素)</p><h3 className="text-3xl font-bold text-slate-800">{stats.C}</h3></div><div className="p-3 rounded-lg bg-green-100 text-green-600"><div className="font-bold text-xl">C</div></div></div>
           </div>
        )}
      </main>
    </div>
  );
}