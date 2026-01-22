
import React, { useState } from 'react';
import { User } from '../types';
import { M3Button, M3Card } from '../components/ui/M3Components';

interface PaymentMethodsProps {
  user: User;
  onSave: (upiId: string) => void;
  onBack: () => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ user, onSave, onBack }) => {
  const [upi, setUpi] = useState(user.upiId || '');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const maskUpi = (id: string) => {
    const [name, provider] = id.split('@');
    if (!provider) return id;
    const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name;
    return `${maskedName}@${provider}`;
  };

  const handleAdd = () => {
    setError('');
    if (!upi.includes('@') || upi.length < 6) {
      setError('Invalid UPI ID format');
      return;
    }
    onSave(upi);
    setIsAdding(false);
  };

  return (
    <div className="pt-24 pb-32 px-4 max-w-xl mx-auto w-full page-transition">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 text-gray-400 hover:text-[#0A3D91]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tighter uppercase italic">Payment Methods</h1>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-2">Stored UPI IDs</h3>
        
        {user.upiId ? (
          <M3Card variant="outlined" className="p-6 flex items-center justify-between border-blue-100 bg-blue-50/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-blue-50 shadow-sm text-xs font-black text-[#0A3D91]">UPI</div>
              <div>
                <p className="text-sm font-black text-[#0F172A]">{maskUpi(user.upiId)}</p>
                <p className="text-[8px] font-bold text-green-600 uppercase tracking-widest mt-0.5">Primary Method</p>
              </div>
            </div>
            <button onClick={() => setIsAdding(true)} className="text-[9px] font-black uppercase text-[#0A3D91] hover:underline">Change</button>
          </M3Card>
        ) : !isAdding && (
          <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No payment methods found</p>
            <M3Button variant="tonal" className="mt-6 !h-12" onClick={() => setIsAdding(true)}>Add UPI ID</M3Button>
          </div>
        )}

        {isAdding && (
          <M3Card variant="outlined" className="p-8 animate-in slide-in-from-top-4 duration-500">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">UPI Address</label>
                <input required className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#0A3D91]" value={upi} onChange={e => setUpi(e.target.value)} placeholder="username@bank" />
              </div>
              {error && <p className="text-[8px] text-red-500 font-black uppercase tracking-widest ml-2">{error}</p>}
              <div className="flex gap-3">
                <M3Button variant="tonal" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</M3Button>
                <M3Button className="flex-1" onClick={handleAdd}>Save UPI</M3Button>
              </div>
            </div>
          </M3Card>
        )}

        <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
           <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2">Protocol Note</h4>
           <p className="text-[9px] text-gray-400 font-medium leading-relaxed">
             Stored payment methods are used for rapid checkouts during expedition booking phases. Travel Tribe does not store your PIN or execute unauthorized debits.
           </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
