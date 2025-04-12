'use client';

import { useState, useEffect } from 'react';
import RotatingText from './RotatingText';

export default function ZakatCalculator() {
  const [yearlyIncome, setYearlyIncome] = useState<number | ''>('');
  const [ketuaKeluarga, setKetuaKeluarga] = useState<string>('Saya Bukan Ketua');
  const [isteriPasangan, setIsteriPasangan] = useState<string>('1 orang');
  const [dewasaTidakBekerja, setDewasaTidakBekerja] = useState<string>('Tiada');
  const [tanggunganPelajar, setTanggunganPelajar] = useState<string>('Tiada');
  const [tanggungan7to17, setTanggungan7to17] = useState<string>('Tiada');
  const [tanggungan6Bawah, setTanggungan6Bawah] = useState<string>('Tiada');
  const [jumlahB1, setJumlahB1] = useState<number>(4944);
  const [caruman, setCaruman] = useState<number | ''>('');
  const [jumlahC, setJumlahC] = useState<number>(0);
  const [jumlahBahagian, setJumlahBahagian] = useState<number>(0);
  const [jumlahZakat, setJumlahZakat] = useState<number>(0);

  // State for dropdown sections
  const [isOpenA, setIsOpenA] = useState<boolean>(true);
  const [isOpenB, setIsOpenB] = useState<boolean>(true);
  const [isOpenC, setIsOpenC] = useState<boolean>(true);
  const [isOpenResult, setIsOpenResult] = useState<boolean>(true);

  const handleYearlyIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d*)?$/.test(value)) {
      setYearlyIncome(value === '' ? '' : parseFloat(value));
    }
  };

  const handleCarumanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d*)?$/.test(value)) {
      setCaruman(value === '' ? '' : parseFloat(value));
    }
  };

  // Calculate the total amount for B1 section
  useEffect(() => {
    let total = 0;

    // B1.1 Ketua Keluarga (if selected)
    if (ketuaKeluarga === 'Saya Ketua') {
      // Add ketua keluarga amount (not specified in the image, using 0 as default)
      total += 0;
    }

    // B1.2 Isteri atau Pasangan (RM4,944 per person)
    if (isteriPasangan !== 'Tiada') {
      const count = parseInt(isteriPasangan.split(' ')[0]);
      total += 4944 * count;
    }

    // B1.3 Dewasa Tidak Bekerja (RM2,004 per person)
    if (dewasaTidakBekerja !== 'Tiada') {
      const count = parseInt(dewasaTidakBekerja.split(' ')[0]);
      total += 2004 * count;
    }

    // B1.4 Tanggungan Pelajar IPT (RM7,356 per person)
    if (tanggunganPelajar !== 'Tiada') {
      const count = parseInt(tanggunganPelajar.split(' ')[0]);
      total += 7356 * count;
    }

    // B1.5 Tanggungan Berumur 7-17 tahun (RM4,896 per person)
    if (tanggungan7to17 !== 'Tiada') {
      const count = parseInt(tanggungan7to17.split(' ')[0]);
      total += 4896 * count;
    }

    // B1.6 Tanggungan 6 Tahun Ke Bawah (RM2,100 per person)
    if (tanggungan6Bawah !== 'Tiada') {
      const count = parseInt(tanggungan6Bawah.split(' ')[0]);
      total += 2100 * count;
    }

    setJumlahB1(total);
  }, [ketuaKeluarga, isteriPasangan, dewasaTidakBekerja, tanggunganPelajar, tanggungan7to17, tanggungan6Bawah]);

  // Calculate the total amount for section C
  useEffect(() => {
    let total = 0;

    // Add KWSP contribution if any
    if (typeof caruman === 'number' && !isNaN(caruman)) {
      total += caruman;
    }

    setJumlahC(total);
  }, [caruman]);

  // Calculate final results: Jumlah Bahagian and Jumlah Zakat
  useEffect(() => {
    // Calculate Jumlah Bahagian: (A) - (B + C)
    const incomeValue = typeof yearlyIncome === 'number' ? yearlyIncome : 0;
    const bahagian = incomeValue - (jumlahB1 + jumlahC);
    const finalBahagian = bahagian > 0 ? bahagian : 0;
    setJumlahBahagian(finalBahagian);

    // Calculate Jumlah Zakat: 2.5% * Jumlah Bahagian
    const zakat = finalBahagian * 0.025;
    setJumlahZakat(zakat);
  }, [yearlyIncome, jumlahB1, jumlahC]);

  const toggleSection = (section: 'A' | 'B' | 'C' | 'Result') => {
    switch (section) {
      case 'A':
        setIsOpenA(!isOpenA);
        break;
      case 'B':
        setIsOpenB(!isOpenB);
        break;
      case 'C':
        setIsOpenC(!isOpenC);
        break;
      case 'Result':
        setIsOpenResult(!isOpenResult);
        break;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-center mb-6">
        <h1 className="text-3xl font-bold text-center inline-flex items-center text-white">
          <span className="mr-2">Zakat</span>
          <RotatingText
            texts={['Kalkulator', 'Pendapatan']}
            mainClassName="px-2 sm:px-2 md:px-3 bg-green-300 text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
        <button
          className="w-full px-6 py-4 text-left bg-emerald-500 text-white font-semibold flex justify-between items-center hover:bg-emerald-700 transition-colors"
          onClick={() => toggleSection('A')}
        >
          <span>Bahagian A : KOMPONEN PENDAPATAN</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpenA ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpenA && (
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="yearlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
                Pendapatan Setahun (RM)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">RM</span>
                </div>
                <input
                  type="text"
                  name="yearlyIncome"
                  id="yearlyIncome"
                  className="block w-full pl-12 text-gray-500 pr-12 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                  aria-describedby="price-currency"
                  value={yearlyIncome}
                  onChange={handleYearlyIncomeChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
        <button
          className="w-full px-6 py-4 text-left bg-emerald-500 text-white font-semibold flex justify-between items-center hover:bg-emerald-700 transition-colors"
          onClick={() => toggleSection('B')}
        >
          <span>Bahagian B : KOMPONEN PENGELUARAN</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpenB ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpenB && (
          <div className="p-6">
            <div className="border border-gray-200 rounded-md p-4 mb-6">
              <h3 className="text-lg text-gray-500 font-medium mb-4">B1 : Had Kifayah Isi Rumah</h3>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.1 Ketua Keluarga
                  </label>
                  <div className="w-full md:w-1/3 text-gray-500">
                    <select
                      value={ketuaKeluarga}
                      onChange={(e) => setKetuaKeluarga(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Saya Bukan Ketua</option>
                      <option>Saya Ketua</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.2 Isteri atau Pasangan<br />
                    <span className="text-sm text-gray-500">(18 tahun ke atas yang di tanggung anda)</span><br />
                    <span className="text-sm text-gray-500">(RM4,944 seorang)</span>
                  </label>
                  <div className="w-full md:w-1/3">
                    <select
                      value={isteriPasangan}
                      onChange={(e) => setIsteriPasangan(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-gray-500 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Tiada</option>
                      <option>1 orang</option>
                      <option>2 orang</option>
                      <option>3 orang</option>
                      <option>4 orang</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.3 Dewasa Tidak Bekerja<br />
                    <span className="text-sm text-gray-500">(18 tahun ke atas yang di tanggung anda)</span><br />
                    <span className="text-sm text-gray-500">(RM2,004 seorang)</span>
                  </label>
                  <div className="w-full md:w-1/3">
                    <select
                      value={dewasaTidakBekerja}
                      onChange={(e) => setDewasaTidakBekerja(e.target.value)}
                      className="mt-1 block w-full pl-3 text-gray-500 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Tiada</option>
                      <option>1 orang</option>
                      <option>2 orang</option>
                      <option>3 orang</option>
                      <option>4 orang</option>
                      <option>5 orang</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.4 Tanggungan Pelajar IPT<br />
                    <span className="text-sm text-gray-500">(RM 7,356 seorang)</span>
                  </label>
                  <div className="w-full md:w-1/3">
                    <select
                      value={tanggunganPelajar}
                      onChange={(e) => setTanggunganPelajar(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-gray-500 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Tiada</option>
                      <option>1 orang</option>
                      <option>2 orang</option>
                      <option>3 orang</option>
                      <option>4 orang</option>
                      <option>5 orang</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.5 Tanggungan Berumur 7-17 tahun<br />
                    <span className="text-sm text-gray-500">(RM4,896 seorang)</span>
                  </label>
                  <div className="w-full md:w-1/3">
                    <select
                      value={tanggungan7to17}
                      onChange={(e) => setTanggungan7to17(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-gray-500 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Tiada</option>
                      <option>1 orang</option>
                      <option>2 orang</option>
                      <option>3 orang</option>
                      <option>4 orang</option>
                      <option>5 orang</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-2/3">
                    B1.6 Tanggungan 6 Tahun Ke Bawah<br />
                    <span className="text-sm text-gray-500">(RM2,100 seorang)</span>
                  </label>
                  <div className="w-full md:w-1/3">
                    <select
                      value={tanggungan6Bawah}
                      onChange={(e) => setTanggungan6Bawah(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base text-gray-500 border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option>Tiada</option>
                      <option>1 orang</option>
                      <option>2 orang</option>
                      <option>3 orang</option>
                      <option>4 orang</option>
                      <option>5 orang</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-500 mb-1 md:mb-0 md:w-2/3">
                    Jumlah [B1]:
                  </label>
                  <div className="w-full md:w-1/3">
                    <input
                      type="text"
                      readOnly
                      className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 text-black bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      value={jumlahB1.toFixed(2)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
        <button
          className="w-full px-6 py-4 text-left bg-emerald-500 text-white font-semibold flex justify-between items-center hover:bg-emerald-700 transition-colors"
          onClick={() => toggleSection('C')}
        >
          <span>BAHAGIAN C: TOLAKAN LAIN</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpenC ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpenC && (
          <div className="p-6">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-6">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-emerald-500">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Bil</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Butiran</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">RM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-gray-50">
                  <tr>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">C1</td>
                    <td className="px-3 py-4 text-sm">
                      <div className="flex items-start">
                        <div className="ml-3">
                          <p className="text-gray-900">Caruman KWSP bahagian pekerja dibawah umur 55 tahun<br />(jumlah gaji kasar x 11%)</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">MYR</span>
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-12 pr-12 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="0.00"
                          value={caruman}
                          onChange={handleCarumanChange}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6" colSpan={2}>Jumlah [C] :</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">RM {jumlahC.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
        <button
          className="w-full px-6 py-4 text-left bg-emerald-500 text-white font-semibold flex justify-between items-center hover:bg-emerald-700 transition-colors"
          onClick={() => toggleSection('Result')}
        >
          <span>HASIL PENGIRAAN</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpenResult ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpenResult && (
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <label className="block text-base font-medium text-gray-900 mb-1 md:mb-0 md:w-2/3">
                  JUMLAH BAHAGIAN<br />
                  <span className="text-sm text-gray-500">(A) - (B + C)</span>
                </label>
                <div className="w-full md:w-1/3">
                  <input
                    type="text"
                    readOnly
                    className="mt-1 block w-full pl-3 pr-3 py-2 text-gray-500 text-base border-gray-300 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={jumlahBahagian.toFixed(2)}
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-gray-200">
                <label className="block text-base font-medium text-gray-900 mb-1 md:mb-0 md:w-2/3">
                  JUMLAH ZAKAT PENDAPATAN ANDA<br />
                  <span className="text-sm text-gray-500">(SETAHUN)</span>
                </label>
                <div className="w-full md:w-1/3">
                  <input
                    type="text"
                    readOnly
                    className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md font-semibold text-emerald-600"
                    value={jumlahZakat.toFixed(3)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
