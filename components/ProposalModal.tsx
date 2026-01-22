
import React, { useState } from 'react';
import { M3Button } from './ui/M3Components';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'TRAVEL' | 'STAY';
  onSubmit: (data: any) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, type, onSubmit }) => {
  const [formData, setFormData] = useState({
    provider: '',
    title: '',
    departTime: '',
    arriveTime: '',
    pricePerPerson: '',
    notes: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-6 bg-[#001A40]/40 backdrop-blur-md">
      <div className="bg-white max-w-lg w-full p-8 md:p-10 rounded-t-[3rem] md:rounded-[3rem] shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter uppercase">
             Propose {type === 'TRAVEL' ? 'Bus' : 'Stay'}
           </h2>
           <button onClick={onClose} className="text-gray-400">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit({...formData, pricePerPerson: Number(formData.pricePerPerson)}); }}>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">Provider (e.g. RedBus, MMT)</label>
                <input required className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} />
             </div>
             <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">{type === 'TRAVEL' ? 'Bus Name / Fleet' : 'Hotel Name'}</label>
                <input required className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
             </div>
             {type === 'TRAVEL' && (
               <>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">Departure</label>
                    <input type="time" required className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" value={formData.departTime} onChange={e => setFormData({...formData, departTime: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">Arrival</label>
                    <input type="time" required className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" value={formData.arriveTime} onChange={e => setFormData({...formData, arriveTime: e.target.value})} />
                 </div>
               </>
             )}
             <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">Price per person (INR)</label>
                <input type="number" required className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" value={formData.pricePerPerson} onChange={e => setFormData({...formData, pricePerPerson: e.target.value})} />
             </div>
             <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest ml-2">Internal Notes</label>
                <textarea className="w-full bg-gray-50 p-4 rounded-2xl text-xs font-bold border border-gray-100 outline-none focus:border-[#0A3D91]" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
             </div>
          </div>
          <M3Button fullWidth type="submit" className="!h-16 mt-4">Add Proposal</M3Button>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;
