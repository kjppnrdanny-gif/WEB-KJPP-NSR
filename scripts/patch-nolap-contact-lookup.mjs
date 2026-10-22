import fs from 'fs';

const filePath = 'nolap-data-handler.php';
let content = fs.readFileSync(filePath, 'utf8');
const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// 1. Update cariPersonelKontak
const targetCari = `            if (strpos($clean, 'danny') !== false && strpos($uid, 'danny') !== false) return $p;
            if (strpos($clean, 'nanang') !== false && strpos($uid, 'nanang') !== false) return $p;
            if (strpos($clean, 'deni') !== false && (strpos($uid, 'deni') !== false || strpos($uid, 'bdg') !== false)) return $p;
            if (strpos($clean, 'hernita') !== false && strpos($uid, 'hernita') !== false) return $p;
            if (strpos($clean, 'amin') !== false && strpos($uid, 'amin') !== false) return $p;
            if (strpos($clean, 'dharma') !== false && strpos($uid, 'dharma') !== false) return $p;
            if (strpos($clean, 'fauzi') !== false && strpos($uid, 'bdg') !== false) return $p;
            if (strpos($clean, 'siti') !== false && strpos($uid, 'pdg') !== false) return $p;
        }
    }

    $cleanOffice = trim($fallbackOfficeId);
    foreach ($list as $p) {
        if (($p['office_id'] ?? '') === $cleanOffice && strpos(strtolower($p['role'] ?? ''), 'admin') !== false) {
            return $p;
        }
    }`;

const replacementCari = `            if (strpos($clean, 'danny') !== false && strpos($uid, 'danny') !== false) return $p;
            if (strpos($clean, 'nanang') !== false && strpos($uid, 'nanang') !== false) return $p;
            if (strpos($clean, 'deni') !== false && (strpos($uid, 'deni') !== false || strpos($uid, 'bdg') !== false)) return $p;
            if (strpos($clean, 'hernita') !== false && strpos($uid, 'hernita') !== false) return $p;
            if (strpos($clean, 'amin') !== false && strpos($uid, 'amin') !== false) return $p;
            if (strpos($clean, 'dharma') !== false && strpos($uid, 'dharma') !== false) return $p;
            if (strpos($clean, 'fauzi') !== false && strpos($uid, 'bdg') !== false) return $p;
            if (strpos($clean, 'siti') !== false && strpos($uid, 'pdg') !== false) return $p;
            if ((strpos($clean, 'mks') !== false || strpos($clean, 'makassar') !== false) && (($p['office_id'] ?? '') === '2.0160-04' || strpos($uid, 'mks') !== false || strpos($uid, 'amin') !== false)) return $p;
            if ((strpos($clean, 'bdg') !== false || strpos($clean, 'bandung') !== false) && (($p['office_id'] ?? '') === '2.0160-01' || strpos($uid, 'bdg') !== false)) return $p;
            if ((strpos($clean, 'pdg') !== false || strpos($clean, 'padang') !== false) && (($p['office_id'] ?? '') === '2.0160-03' || strpos($uid, 'pdg') !== false)) return $p;
            if ((strpos($clean, 'plb') !== false || strpos($clean, 'palembang') !== false) && (($p['office_id'] ?? '') === '2.0160-05' || strpos($uid, 'plb') !== false)) return $p;
        }
    }

    $cleanOffice = trim($fallbackOfficeId);
    $officeMap = [
        'BDG' => '2.0160-01',
        'PDG' => '2.0160-03',
        'MKS' => '2.0160-04',
        'PLB' => '2.0160-05',
        'PST' => '2.0160-00',
        'Bandung' => '2.0160-01',
        'Padang' => '2.0160-03',
        'Makassar' => '2.0160-04',
        'Palembang' => '2.0160-05',
        'Pusat' => '2.0160-00'
    ];
    if (isset($officeMap[$cleanOffice])) {
        $cleanOffice = $officeMap[$cleanOffice];
    }
    foreach ($list as $p) {
        if (($p['office_id'] ?? '') === $cleanOffice) {
            return $p;
        }
    }`;

if (!content.includes(targetCari)) {
  throw new Error('targetCari not found in nolap-data-handler.php');
}
content = content.replace(targetCari, replacementCari);

// 2. Update getRequesterContactProfile
const targetProfile = `'whatsapp_number'   => $profile['whatsapp_number'] ?? '',
                'whatsapp_verified' => !empty($profile['whatsapp_verified']),`;

const replacementProfile = `'whatsapp_number'   => $profile['whatsapp_number'] ?? '',
                'whatsapp_verified' => !empty($profile['whatsapp_verified']),
                'wa_normalized'     => normalisasiNomorWhatsApp($profile['whatsapp_number'] ?? ''),`;

if (!content.includes(targetProfile)) {
  throw new Error('targetProfile not found in nolap-data-handler.php');
}
content = content.replace(targetProfile, replacementProfile);

if (isCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Successfully updated cariPersonelKontak and getRequesterContactProfile in nolap-data-handler.php');
