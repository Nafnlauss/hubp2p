/**
 * Testes e exemplos de uso para as funções de formatação
 * Estes exemplos demonstram como usar cada função
 */

import {
  formatCPF,
  validateCPF,
  formatCurrency,
  formatCryptoAddress,
  validateWalletAddress,
  formatPhone,
  validatePhone,
  truncateText,
  formatTxHash,
} from './format';

// ============= EXEMPLOS DE USO =============

export const formatExamples = {
  // CPF
  cpf: {
    format: () => {
      const cpf = formatCPF('12345678901');
      console.log(cpf); // Output: 123.456.789-01
    },
    validate: () => {
      // CPF válido de teste
      const isValid = validateCPF('123.456.789-09');
      console.log(isValid); // true ou false
    },
  },

  // Moeda
  currency: {
    format: () => {
      const valor = formatCurrency(1500.5);
      console.log(valor); // Output: R$ 1.500,50
    },
    formatWithLocale: () => {
      const valor = formatCurrency(1500.5, 'en-US');
      console.log(valor); // Output: $1,500.50
    },
  },

  // Endereço de Criptomoeda
  cryptoAddress: {
    ethereum: () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00';
      const formatted = formatCryptoAddress(address);
      console.log(formatted); // Output: 0x742d35Cc6...FFf2b00
    },
    bitcoin: () => {
      const address = '1A1z7agoat4Vu5t1WV2pj5LcR7k51DEXXX';
      const formatted = formatCryptoAddress(address, 12, 12);
      console.log(formatted); // Output: 1A1z7agoat4...k51DEXXX
    },
  },

  // Validação de Endereço
  walletAddress: {
    ethereum: () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00';
      const isValid = validateWalletAddress(address, 'ethereum');
      console.log(isValid); // true
    },
    bitcoin: () => {
      const address = '1A1z7agoat4Vu5t1WV2pj5LcR7k51DEXXX';
      const isValid = validateWalletAddress(address, 'bitcoin');
      console.log(isValid); // true ou false
    },
    solana: () => {
      const address = '11111111111111111111111111111112';
      const isValid = validateWalletAddress(address, 'solana');
      console.log(isValid); // true ou false
    },
  },

  // Telefone
  phone: {
    format: () => {
      const phone = formatPhone('11987654321');
      console.log(phone); // Output: (11) 98765-4321
    },
    validate: () => {
      const isValid = validatePhone('(11) 98765-4321');
      console.log(isValid); // true
    },
  },

  // Truncar Texto
  truncate: {
    basic: () => {
      const text = truncateText('Este é um texto muito longo', 20);
      console.log(text); // Output: Este é um texto muit...
    },
  },

  // Hash de Transação
  txHash: {
    format: () => {
      const hash =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const formatted = formatTxHash(hash);
      console.log(formatted); // Output: 0x123456...cdef
    },
  },
};

// ============= TESTES UNITÁRIOS =============

export const formatTests = {
  testCPFValidation: () => {
    const tests = [
      { cpf: '123.456.789-09', expected: false }, // Exemplo inválido
      { cpf: '00000000000', expected: false }, // Sequência
      { cpf: '111.111.111-11', expected: false }, // Sequência
    ];

    tests.forEach(({ cpf, expected }) => {
      const result = validateCPF(cpf);
      console.log(
        `validateCPF('${cpf}'): ${result === expected ? 'PASS' : 'FAIL'}`
      );
    });
  },

  testCurrencyFormatting: () => {
    const tests = [
      { value: 0, expected: 'R$ 0,00' },
      { value: 1000.5, expected: 'R$ 1.000,50' },
      { value: 999999.99, expected: 'R$ 999.999,99' },
    ];

    tests.forEach(({ value, expected }) => {
      const result = formatCurrency(value);
      console.log(
        `formatCurrency(${value}): ${result === expected ? 'PASS' : 'FAIL'}`
      );
    });
  },

  testCryptoAddressTruncation: () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00';
    const formatted = formatCryptoAddress(address);

    const isCorrectFormat =
      formatted.startsWith('0x742d35Cc6') &&
      formatted.endsWith('Ff2b00') &&
      formatted.includes('...');

    console.log(`formatCryptoAddress: ${isCorrectFormat ? 'PASS' : 'FAIL'}`);
  },

  testWalletValidation: () => {
    const tests = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc5e3c3EFf2b00',
        network: 'ethereum',
        expected: true,
      },
      {
        address: '0xINVALID',
        network: 'ethereum',
        expected: false,
      },
      {
        address: 'invalidaddress',
        network: 'unknown',
        expected: true, // Basic validation for unknown networks
      },
    ];

    tests.forEach(({ address, network, expected }) => {
      const result = validateWalletAddress(address, network);
      console.log(
        `validateWalletAddress('${address}', '${network}'): ${result === expected ? 'PASS' : 'FAIL'}`
      );
    });
  },

  testPhoneValidation: () => {
    const tests = [
      { phone: '11987654321', expected: true },
      { phone: '(11) 98765-4321', expected: true },
      { phone: '123', expected: false },
      { phone: '', expected: false },
    ];

    tests.forEach(({ phone, expected }) => {
      const result = validatePhone(phone);
      console.log(
        `validatePhone('${phone}'): ${result === expected ? 'PASS' : 'FAIL'}`
      );
    });
  },

  testTextTruncation: () => {
    const text = 'Este é um texto muito longo que precisa ser truncado';
    const truncated = truncateText(text, 20);

    const isCorrect = truncated.length === 23 && truncated.endsWith('...');

    console.log(`truncateText: ${isCorrect ? 'PASS' : 'FAIL'}`);
  },
};

// ============= INSTRUÇÕES DE USO =============

/**
 * COMO USAR ESTAS FUNÇÕES NO SEU CÓDIGO:
 *
 * 1. IMPORTAR AS FUNÇÕES:
 *    import { formatCPF, validateCPF, formatCurrency } from '@/lib/utils/format';
 *
 * 2. USAR EM COMPONENTES:
 *
 *    'use client';
 *
 *    import { formatCurrency } from '@/lib/utils/format';
 *
 *    export function PriceDisplay({ price }: { price: number }) {
 *      return <div>{formatCurrency(price)}</div>;
 *    }
 *
 * 3. VALIDAR INPUTS:
 *
 *    import { validateCPF, validateWalletAddress } from '@/lib/utils/format';
 *
 *    function handleFormSubmit(formData: FormData) {
 *      const cpf = formData.get('cpf') as string;
 *      const walletAddress = formData.get('wallet') as string;
 *
 *      if (!validateCPF(cpf)) {
 *        alert('CPF inválido!');
 *        return;
 *      }
 *
 *      if (!validateWalletAddress(walletAddress, 'ethereum')) {
 *        alert('Endereço de carteira inválido!');
 *        return;
 *      }
 *    }
 *
 * 4. FORMATAR DADOS PARA EXIBIÇÃO:
 *
 *    import { formatCPF, formatPhone, formatCryptoAddress } from '@/lib/utils/format';
 *
 *    export function UserProfile({ user }: { user: User }) {
 *      return (
 *        <div>
 *          <p>CPF: {formatCPF(user.cpf)}</p>
 *          <p>Telefone: {formatPhone(user.phone)}</p>
 *          <p>Carteira: {formatCryptoAddress(user.wallet)}</p>
 *        </div>
 *      );
 *    }
 */
