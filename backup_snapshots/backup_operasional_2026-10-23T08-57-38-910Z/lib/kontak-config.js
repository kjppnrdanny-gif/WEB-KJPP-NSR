/**
 * KONFIGURASI RESMI KONTAK TERPUSAT KJPP NANANG RAHAYU SIGIT PARYANTO & REKAN
 * Sumber Data Final Terverifikasi: Pemilik Website KJPP NSR
 *
 * DATA KONTAK RESMI:
 * Telepon 1 : (021) 7884-9996 -> tel:+622178849996
 * Telepon 2 : (021) 7884-8837 -> tel:+622178848837
 * Fax       : (021) 7884-9997 (Khusus Fax, bukan telepon utama)
 * WA Admin  : 0851-1051-3157 -> https://wa.me/6285110513157
 * Email     : nanang_kjpp@yahoo.co.id
 */
(function (global) {
  'use strict';

  var KONTAK_RESMI = {
    telepon1: '(021) 7884-9996',
    telepon2: '(021) 7884-8837',
    teleponDisplay: '(021) 7884-9996 / (021) 7884-8837',
    fax: '(021) 7884-9997',
    waAdmin: '0851-1051-3157',
    waAdminRaw: '6285110513157',
    email: 'nanang_kjpp@yahoo.co.id',

    links: {
      tel1: 'tel:+622178849996',
      tel2: 'tel:+622178848837',
      wa: 'https://wa.me/6285110513157',
      email: 'mailto:nanang_kjpp@yahoo.co.id'
    },

    kantorPusat: {
      nama: 'Kantor Pusat Jakarta',
      alamat: 'Jl. Hankam No. 5 RT 006 RW 001, Kelurahan Ragunan, Kecamatan Pasar Minggu, Jakarta Selatan, DKI Jakarta 12550',
      telepon: '(021) 7884-9996 / (021) 7884-8837',
      fax: '(021) 7884-9997',
      waAdmin: '0851-1051-3157',
      email: 'nanang_kjpp@yahoo.co.id'
    }
  };

  global.KONTAK_KJPP_NSR = KONTAK_RESMI;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = KONTAK_RESMI;
  }
})(typeof window !== 'undefined' ? window : globalThis);
