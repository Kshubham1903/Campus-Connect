// frontend/src/components/HomeHero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeHero() {
  const navigate = useNavigate();
  return (
    <section className="bg-gradient-to-r from-white to-gray-50 py-12">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            Connect with experienced seniors — get help, fast.
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl">
            CampusConnect pairs juniors with seniors from your college to help solve problems, review code, and guide projects. Request help, get accepted, and chat in real-time.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={()=>navigate('/')} className="px-5 py-3 rounded-md bg-primary text-white font-semibold shadow">Explore Seniors</button>
            <button onClick={()=>navigate('/login')} className="px-5 py-3 rounded-md border">Login / Signup</button>
          </div>

          <div className="mt-6 flex gap-4 text-sm text-gray-500">
            <div><strong>Fast response</strong><span className="ml-2">• Connect within minutes</span></div>
            <div><strong>Verified seniors</strong><span className="ml-2">• Hand-picked mentors</span></div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-soft p-6 border">
            <div className="text-sm text-gray-500">Featured seniors</div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Riya S.</div>
                <div className="text-xs text-gray-500">DSA • C++ • 3rd year</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Aman K.</div>
                <div className="text-xs text-gray-500">Web • React • Node</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Priya M.</div>
                <div className="text-xs text-gray-500">DBMS • SQL</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-semibold">Rahul P.</div>
                <div className="text-xs text-gray-500">ML • Python</div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400">Tip: You can request help for debugging, project guidance, study advice and more.</div>
        </div>
      </div>
    </section>
  );
}
