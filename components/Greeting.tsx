'use client';

import { useEffect, useState } from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Greeting() {
  const [greeting, setGreeting] = useState('Good evening');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
    setDateStr(formatDate(new Date()));
  }, []);

  return (
    <div className="mb-6">
      <h1 className="font-serif text-4xl font-normal tracking-tight text-heading sm:text-5xl">
        {greeting}
      </h1>
      <p className="mt-1 text-sm font-light tracking-widest text-muted-foreground">
        {dateStr}
      </p>
    </div>
  );
}
