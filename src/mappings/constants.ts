import {Address, BigDecimal, BigInt, dataSource, log} from '@graphprotocol/graph-ts';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const ADDRESS_SATIN = '0x6913717b010E8c8E05043B5eB22cfB63A22C85AE'
export const ADDRESS_4POOL = "0x844b7bd45bc949c96329fdc953a516a8e1daec51"
export const ADDRESS_REWARDTOKEN = '0x1C9B56F6608904876b279821D037aEED8bea48D9'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let DAY = BigDecimal.fromString('86400')

const network = dataSource.network();

// ***********************************************************************
//                    IMPLEMENT FOR EACH NETWORK
// ***********************************************************************

// minimum liquidity for price to get tracked = 0.01 ETH
export const MINIMUM_LIQUIDITY_THRESHOLD_USD = BigDecimal.fromString('10')

export const DEFAULT_STABLE_FEE = 10_000;
export const DEFAULT_VOLATILE_FEE = 2_000;

export function wethAddress(): Address {
  if (network == 'matic') {
    return Address.fromString('0x7ceb23fd6bc0add59e62ac25578270cff1b9f619');
  } else if (network == 'bsc') {
    return Address.fromString('0x2170ed0880ac9a755fd29b2688956bd959f933f8');
  } else {
    log.critical("UNKNOWN NETWORK {}", [network])
    return Address.fromString(ADDRESS_ZERO);
  }
}

export function usdcAddress(): Address {
  if (network == 'matic') {
    return Address.fromString('0x2791bca1f2de4661ed88a30c99a7a9449aa84174');
  } else if (network == 'bsc') {
    return Address.fromString('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d');
  } else {
    log.critical("UNKNOWN NETWORK {}", [network])
    return Address.fromString(ADDRESS_ZERO);
  }
}

export function usdcWethPairAddress(): Address {
  if (network == 'matic') {
    return Address.fromString('0x19a4b9be0ee3e258f7616af8fc199376d13d527a');
  } else if (network == 'bsc') {
    return Address.fromString('0x89B26AF36fA8705A27934fcED56D154BDA01315a');
  } else {
    log.critical("UNKNOWN NETWORK {}", [network])
    return Address.fromString(ADDRESS_ZERO);
  }
}

// token where amounts should contribute to tracked volume and liquidity
export function whitelisted(): Address[] {
  if (network == 'matic') {
    return [
      wethAddress(),
      Address.fromString('0x2791bca1f2de4661ed88a30c99a7a9449aa84174'), // USDC
      Address.fromString('0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'), // WMATIC
      Address.fromString('0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'), // WBTC
      Address.fromString('0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'), // DAI
      Address.fromString('0xc2132d05d31c914a87c6611c10748aeb04b58e8f'), // USDT
      Address.fromString('0xa3Fa99A148fA48D14Ed51d610c367C61876997F1'), // MAI
      Address.fromString('0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89'), // FRAX
      Address.fromString('0x80487b4f8f70e793A81a42367c225ee0B94315DF'), // CASH
      Address.fromString('0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4'), // stmatic
      Address.fromString('0x7ee811561c61efc79664ab0ac120d7968157629a'), // SATIN
      Address.fromString('0xfa68fb4628dff1028cfec22b4162fccd0d45efb6'), // MaticX
      Address.fromString('0x434e7bbbc9ae9f4ffade0b3175fef6e8a4a1c505'), // LQDR
      Address.fromString('0xb5DFABd7fF7F83BAB83995E72A52B97ABb7bcf63'), // USDR
      Address.fromString('0xbC2b48BC930Ddc4E5cFb2e87a45c379Aab3aac5C'), // DOLA
      Address.fromString('0xFbdd194376de19a88118e84E279b977f165d01b8'), // BIFI
      Address.fromString('0x596eBE76e2DB4470966ea395B0d063aC6197A8C5'), // JRT
      Address.fromString('0xbd1fe73e1f12bd2bc237de9b626f056f21f86427'), // jMXN
      Address.fromString('0x18ec0A6E18E5bc3784fDd3a3634b31245ab704F6'), // EURe
      Address.fromString('0x491a4eB4f1FC3BfF8E1d2FC856a6A46663aD556f'), // BRZ
      Address.fromString('0x62F594339830b90AE4C084aE7D223fFAFd9658A7'), // SPHERE
      Address.fromString('0xd23Ed8cA350CE2631F7EcDC5E6bf80D0A1DeBB7B'), // TAROT
      Address.fromString('0x1e3c6c53F9f60BF8aAe0D7774C21Fa6b1afddC57'), // SHRAP
      Address.fromString('0x74ccbe53F77b08632ce0CB91D3A545bF6B8E0979'), // fBOMB
      Address.fromString('0x94DC0b13E66ABa9450b3Cc44c2643BBb4C264BC7'), // LIBERA
      Address.fromString('0x525b43A49bE2Ed530e3516C22bd7ECbcF1586AD4'), // FS
      Address.fromString('0x91993f2101cc758D0dEB7279d41e880F7dEFe827'), // gDAI
      Address.fromString('0x1d734A02eF1e1f5886e66b0673b71Af5B53ffA94'), // SD
      Address.fromString('0x4e3decbb3645551b8a19f0ea1678079fcb33fb4c'), // jEUR
      Address.fromString('0xf2f77FE7b8e66571E0fca7104c4d670BF1C8d722'), // jBRL
      Address.fromString('0xa411c9Aa00E020e4f88Bc19996d29c5B7ADB4ACf'), // XOC
      Address.fromString('0x580A84C73811E1839F75d86d75d88cCa0c241fF4'), // QI
      Address.fromString('0x03b54A6e9a984069379fae1a4fC4dBAE93B3bCCD'), // wstmatic
      
    ]
  } else if (network == 'bsc') {
    return [
      Address.fromString('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'), // WBNB
      Address.fromString('0x2170ed0880ac9a755fd29b2688956bd959f933f8'), // WETH
      Address.fromString('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'), // USDC
      Address.fromString('0x90c97f71e18723b0cf0dfa30ee176ab653e89f40'), // FRAX
      Address.fromString('0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3'), // DAI
      Address.fromString('0x55d398326f99059ff775485246999027b3197955'), // USDT
      Address.fromString('0x3f56e0c36d275367b8c502090edf38289b3dea0d'), // MAI
      Address.fromString('0xe9e7cea3dedca5984780bafc599bd69add087d56'), // BUSD
      Address.fromString('0xe80772eaf6e2e18b651f160bc9158b2a5cafca65'), // USD+
      Address.fromString('0xA60205802E1B5C6EC1CAFA3cAcd49dFeECe05AC9'), // CONE
    ];
  } else {
    log.critical("UNKNOWN NETWORK {}", [network])
    return [Address.fromString(ADDRESS_ZERO)];
  }
}

export function stablecoins(): Address[] {
  if (network == 'matic') {
    return [
      Address.fromString('0x2791bca1f2de4661ed88a30c99a7a9449aa84174'), // USDC
      Address.fromString('0x8f3cf7ad23cd3cadbd9735aff958023239c6a063'), // DAI
      Address.fromString('0xc2132d05d31c914a87c6611c10748aeb04b58e8f'), // USDT
      Address.fromString('0xa3Fa99A148fA48D14Ed51d610c367C61876997F1'), // MAI
      Address.fromString('0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89'), // FRAX
      Address.fromString('0xacfdecb377e7a8b26ce033bdb01cb7630ef07809'), // CASH
    ]
  } else if (network == 'bsc') {
    return [
      Address.fromString('0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'), // USDC
      // Address.fromString('0x90c97f71e18723b0cf0dfa30ee176ab653e89f40'), // FRAX
      Address.fromString('0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3'), // DAI
      Address.fromString('0x55d398326f99059ff775485246999027b3197955'), // USDT
      // Address.fromString('0x3f56e0c36d275367b8c502090edf38289b3dea0d'), // MAI
      Address.fromString('0xe9e7cea3dedca5984780bafc599bd69add087d56'), // BUSD
    ]
  } else {
    log.critical("UNKNOWN NETWORK {}", [network])
    return [Address.fromString(ADDRESS_ZERO)];
  }
}
