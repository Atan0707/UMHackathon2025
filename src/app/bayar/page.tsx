'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BayarPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    jenisId: 'KAD PENGENALAN BARU',
    nomorId: '',
    telefon: '',
    jenisZakat: 'ZAKAT PENDAPATAN',
    tahun: '2025',
    jumlah: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="container mx-auto py-16 px-4 max-w-4xl">
      {/* Steps indicator */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 1 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>1. Isi Maklumat Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 2 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>2. Pilih Kaedah Bayaran</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 3 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 3 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>3. Pilih Bank</p>
          </div>

          {/* Connector */}
          <div className="flex-1 mx-4 h-1 bg-gray-300">
            <div className={`h-full ${step >= 4 ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ width: step >= 4 ? '100%' : '0%' }}></div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 flex items-center justify-center rounded-full border-2 ${step >= 4 ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className={`mt-2 text-xs sm:text-sm font-medium ${step >= 4 ? 'text-blue-600' : 'text-gray-500'}`}>4. Resit Bayaran Zakat</p>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Masukkan Maklumat Pembayaran</h2>
            
            <div className="space-y-4">
              {/* Nama Penuh */}
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="MUHAMMAD HAZRIL FAHMI BIN MARHUM @ MARHALIM"
                />
                <p className="mt-1 text-xs text-gray-500">Nama penuh pengeluar zakat (seperti Kad Pengenalan)</p>
              </div>
              
              {/* Jenis Pengenalan */}
              <div>
                <label htmlFor="jenisId" className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Pengenalan
                </label>
                <select
                  id="jenisId"
                  name="jenisId"
                  value={formData.jenisId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>KAD PENGENALAN BARU</option>
                  <option>PASPORT</option>
                </select>
              </div>
              
              {/* Nombor Pengenalan */}
              <div>
                <label htmlFor="nomorId" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombor Pengenalan
                </label>
                <input
                  type="text"
                  id="nomorId"
                  name="nomorId"
                  value={formData.nomorId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="031111010755"
                />
                <p className="mt-1 text-xs text-gray-500">Contoh: Mykad: 700229099995 atau Passport: A7094223 atau No. Syarikat: 1220150488U</p>
              </div>
              
              {/* Nombor Telefon */}
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombor Telefon
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+60</span>
                  <input
                    type="text"
                    id="telefon"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1169363271"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Contoh: 0123617045</p>
              </div>
              
              {/* Jenis Zakat */}
              <div>
                <label htmlFor="jenisZakat" className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Zakat
                </label>
                <select
                  id="jenisZakat"
                  name="jenisZakat"
                  value={formData.jenisZakat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>ZAKAT PENDAPATAN</option>
                  <option>ZAKAT PERNIAGAAN</option>
                  <option>ZAKAT SIMPANAN</option>
                  <option>ZAKAT EMAS</option>
                </select>
              </div>
              
              {/* Haul / Tahun */}
              <div>
                <label htmlFor="tahun" className="block text-sm font-medium text-gray-700 mb-1">
                  Haul / Tahun
                </label>
                <select
                  id="tahun"
                  name="tahun"
                  value={formData.tahun}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>2023</option>
                  <option>2024</option>
                  <option>2025</option>
                </select>
              </div>
              
              {/* Jumlah Bayaran */}
              <div>
                <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700 mb-1">
                  JUMLAH BAYARAN ( RM )
                </label>
                <input
                  type="text"
                  id="jumlah"
                  name="jumlah"
                  value={formData.jumlah}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">* Minimum RM10.00, Maximum RM100,000.00 (RM) untuk satu transaksi</p>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Pilih Kaedah Bayaran</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="text-lg font-medium mb-2">FPX Perbankan Internet</h3>
                <p className="text-sm text-gray-600">Bayar menggunakan akaun bank anda melalui FPX</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="text-lg font-medium mb-2">Kad Kredit/Debit</h3>
                <p className="text-sm text-gray-600">Bayar menggunakan kad kredit atau debit</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-blue-600">Pilih Bank</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/maybank.png" alt="Maybank" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">Maybank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/cimb.png" alt="CIMB" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">CIMB Bank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/rhb.png" alt="RHB" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">RHB Bank</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/bankislam.png" alt="Bank Islam" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">Bank Islam</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/bsn.png" alt="BSN" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">BSN</p>
              </div>
              <div className="border border-gray-300 rounded-md p-4 hover:border-blue-500 cursor-pointer">
                <img src="/banks/ambank.png" alt="AmBank" className="h-12 mx-auto mb-2" />
                <p className="text-center text-sm">AmBank</p>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Pembayaran Berjaya!</h2>
            <p className="text-gray-600 mb-6">Pembayaran zakat anda telah berjaya diproses</p>
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto border border-gray-200">
              <h3 className="font-semibold mb-4 text-gray-800">Butiran Pembayaran</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{formData.nama || 'MUHAMMAD HAZRIL FAHMI'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Pengenalan:</span>
                  <span className="font-medium">{formData.nomorId || '031111010755'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jenis Zakat:</span>
                  <span className="font-medium">{formData.jenisZakat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-medium">RM {formData.jumlah || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarikh:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No. Resit:</span>
                  <span className="font-medium">ZKT-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
                </div>
              </div>
            </div>
            <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Muat Turun Resit
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              SEMULA
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              SETERUSNYA
            </button>
          ) : (
            <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              KEMBALI KE LAMAN UTAMA
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
