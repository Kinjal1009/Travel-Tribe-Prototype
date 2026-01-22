import React from 'react';

const Contact: React.FC = () => {
  return (
    <div className="min-h-screen pt-24 px-6 pb-32 flex flex-col items-center justify-center text-center bg-[#F8FAFF]">
      <div className="max-w-4xl space-y-16">
        <div className="space-y-6">
          <span className="text-[#0A3D91] text-[11px] font-black tracking-[0.5em] uppercase block">Global Concierge</span>
          <h1 className="text-6xl md:text-7xl font-black leading-none text-[#0F172A] tracking-tighter drop-shadow-sm">We're here to <br/> <span className="italic text-[#0A3D91]">Refine</span> your Journey.</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
            <div className="text-[#0A3D91] mb-6 flex justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h3 className="font-black text-[#0F172A] mb-2 uppercase tracking-widest text-xs">Email Desk</h3>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">expeditions@traveltribe.in</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
            <div className="text-[#0A3D91] mb-6 flex justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            </div>
            <h3 className="font-black text-[#0F172A] mb-2 uppercase tracking-widest text-xs">Direct Line</h3>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">+91 800-TRIBE-X</p>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group">
            <div className="text-[#0A3D91] mb-6 flex justify-center group-hover:scale-110 transition-transform">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 className="font-black text-[#0F172A] mb-2 uppercase tracking-widest text-xs">HQ / Command</h3>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Silicon Hub, BLR</p>
          </div>
        </div>

        <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.4em] leading-loose max-w-2xl mx-auto italic">
          Avg Response: 120 Minutes. Active explorers have 24/7 priority access to the safety shield dispatch team.
        </p>
      </div>
    </div>
  );
};

export default Contact;