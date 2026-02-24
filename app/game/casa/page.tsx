import { Suspense } from 'react';
import CasaPageContent from './CasaPageContent';

export default function CasaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">Carregando...</div>}>
      <CasaPageContent />
    </Suspense>
  );
}
