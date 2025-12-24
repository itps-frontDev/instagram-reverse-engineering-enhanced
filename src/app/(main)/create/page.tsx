/**
 * @fileoverview Pagina Creazione Post.
 * 
 * Upload e pubblicazione di nuovi post.
 */

'use client';

import { Upload } from 'lucide-react';

export default function CreatePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-semibold mb-6">Crea nuovo post</h1>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-semibold mb-2">Trascina foto e video qui</p>
        <p className="text-sm text-gray-500 mb-6">oppure</p>
        <button className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold">
          Seleziona dal computer
        </button>
      </div>
    </div>
  );
}
