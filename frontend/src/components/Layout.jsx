import React from 'react';

export default function Layout({ children }) {
return (
<div className="min-h-screen bg-transparent">
<main className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 py-6 sm:py-8 lg:py-10">
<div className="mx-auto max-w-[1600px] space-y-8 sm:space-y-10">
{children}
</div>
</main>
</div>
);
}

