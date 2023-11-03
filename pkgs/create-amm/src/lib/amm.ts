var xrpl = require('xrpl')
import {
  EXPLORER
} from './../util/consts';

type TokenInfo = {
  "currency": string;
  "value": string;
  "issuer": string;
}

export type AmmInfo = {
  "command": string;
  "asset": {
    "currency": string;
    "issuer": string;
  },
  "asset2": {
    "currency": string;
    "issuer": string;
  },
  "ledger_index": "validated"
}

/**
 * トークンを取得するメソッド
 */
export const acquireTokens = async(
  client: any,
  wallet: any,
  token: TokenInfo,
) => {
  try {
    const offer_result = await client.submitAndWait({
      "TransactionType": "OfferCreate",
      "Account": wallet.address,
      "TakerPays": {
        currency: token.currency,
        issuer: token.issuer,
        value: "1000"
      },
      "TakerGets": xrpl.xrpToDrops(25*10*1.16)
    }, {
      autofill: true, 
      wallet: wallet
    })

    // get metaData & TransactionResult
    const metaData: any = offer_result.result.meta!;
    const transactionResult = metaData.TransactionResult;
  
    if (transactionResult == "tesSUCCESS") {
      console.log(`MSH offer placed: ${EXPLORER}/transactions/${offer_result.result.hash}`)
      const balance_changes = xrpl.getBalanceChanges(metaData)
  
      for (const bc of balance_changes) {
        if (bc.account != wallet.address) {continue}
        for (const bal of bc.balances) {
          if (bal.currency == "MSH") {
            console.log(`Got ${bal.value} ${bal.currency}.${bal.issuer}.`)
            break
          }
        }
        break
      }
  
    } else {
      throw `Error sending transaction: ${offer_result}`
    }
  } catch(err) {
    console.error("Acquire tokens err: ", err)
  }
};

/**
 * すでにトークンペアのAMMが作成されているか確認する関数
 */
export const checkExistsAmm = async (
  client: any,
  amm_info_request: AmmInfo, 
  token1Info: TokenInfo,
  token2Info: TokenInfo
) => {

  try {
    const amm_info_result = await client.request(amm_info_request)
    console.log(amm_info_result)
  } catch(err: any) {
    if (err.data.error === 'actNotFound') {
      console.log(`No AMM exists yet for the pair
                   ${token2Info.currency}.${token2Info.issuer} /
                   ${token1Info.currency}.${token1Info.issuer}
                   (This is probably as expected.)`)
    } else {
      throw(err)
    }
  }
};

/**
 * AMMのコストを取得するメソッド
 */
export const getAmmcost = async(
  client: any
): Promise<string> => {
  const ss = await client.request({
    "command": "server_state"
  })
  const amm_fee_drops = ss.result.state.validated_ledger!.reserve_inc.toString()
  console.log(`Current AMMCreate transaction cost: ${xrpl.dropsToXrp(amm_fee_drops)} XRP`)

  return amm_fee_drops;
}

/**
 * AMMを作成するメソッド
 */
export const createAmm = async(
  client: any,
  wallet: any,
  token1Info: TokenInfo,
  token2Info: TokenInfo,
  amm_fee_drops: string,
) => {
  try {
    const ammcreate_result = await client.submitAndWait({
      "TransactionType": "AMMCreate",
      "Account": wallet.address,
      "Amount": {
        currency: token1Info.currency,
        issuer: token1Info.issuer,
        value: "15"
      },
      "Amount2": {
        "currency": token2Info.currency,
        "issuer": token2Info.issuer,
        "value": "100"
      },
      "TradingFee": 500, // 0.5%
      "Fee": amm_fee_drops
    }, {
      autofill: true, 
      wallet: wallet, 
      failHard: true
    })

    // get metaData & TransactionResult
    const metaData: any = ammcreate_result.result.meta!;
    const transactionResult = metaData.TransactionResult;
  
    // Use fail_hard so you don't waste the tx cost if you mess up
    if (transactionResult == "tesSUCCESS") {
      console.log(`AMM created: ${EXPLORER}/transactions/${ammcreate_result.result.hash}`)
    } else {
      throw `Error sending transaction: ${JSON.stringify(ammcreate_result)}`
    }
  } catch(err) {
    console.error("create amm err:", err)
  }
}

/**
 * AMMの状況を確認するメソッド
 */
export const confirmAmm = async(
  client: any,
  wallet: any,
  amm_info_request: AmmInfo
): Promise<any> => {
  try {
    // get AMM info
    const amm_info_result2 = await client.request(amm_info_request)
    console.log("amm_info_result2:", amm_info_result2)

    const results = amm_info_result2.result as any;

    const lp_token = results.amm.lp_token
    const amount = results.amm.amount
    const amount2 = results.amm.amount2

    console.log(`The AMM account ${lp_token.issuer} has ${lp_token.value} total
                LP tokens outstanding, and uses the currency code ${lp_token.currency}.`)
    console.log(`In its pool, the AMM holds ${amount.value} ${amount.currency}.${amount.issuer}
                and ${amount2.value} ${amount2.currency}.${amount2.issuer}`)

    // check balanse
    const account_lines_result = await client.request({
      "command": "account_lines",
      "account": wallet.address,
      // Tip: To look up only the new AMM's LP Tokens, uncomment:
      // "peer": lp_token.issuer,
      "ledger_index": "validated"
    })
    return account_lines_result;
  } catch(err) {
    console.error("Check token balances err:", err)
    return null;
  }
}

/* Issue tokens function ---------------------------------------------------------------
 * Fund a new issuer using the faucet, and issue some fungible tokens
 * to the specified address. In production, you would not do this; instead,
 * you would acquire tokens from an existing issuer (for example, you might
 * buy them in the DEX, or make an off-ledger deposit at a stablecoin issuer).
 * For a more thorough explanation of this process, see
 * "Issue a Fungible Token": https://xrpl.org/issue-a-fungible-token.html
 * Params:
 * client: an xrpl.Client instance that is already connected to the network
 * wallet: an xrpl.Wallet instance that should hold the new tokens
 * currency_code: string currency code (3-char ISO-like or hex code)
 * issue_quantity: string number of tokens to issue. Arbitrarily capped
 *                 at "10000000000"
 * Resolves to: an "Amount"-type JSON object, such as:
 * {
 *   "currency": "TST",
 *   "issuer": "rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd",
 *   "value": "123.456"
 * }
 * 
 * @param client 
 * @param wallet 
 * @param currency_code 
 * @param issue_quantity 
 * @returns 
 */
export const get_new_token = async (
  client: any,
  wallet: any,
  currency_code: string, 
  issue_quantity: string
) => {
  // Get credentials from the Testnet Faucet -----------------------------------
  console.log("Funding an issuer address with the faucet...")
  const issuer = (await client.fundWallet()).wallet
  console.log(`Got issuer address ${issuer.address}.`)

  // Enable issuer DefaultRipple ----------------------------------------------
  const issuer_setup_result = await client.submitAndWait({
    "TransactionType": "AccountSet",
    "Account": issuer.address,
    "SetFlag": xrpl.AccountSetAsfFlags.asfDefaultRipple
  }, {
    autofill: true, 
    wallet: issuer
  } )

  // get metaData & TransactionResult
  const metaData: any = issuer_setup_result.result.meta!;
  const transactionResult = metaData.TransactionResult;

  if (transactionResult == "tesSUCCESS") {
    console.log(`Issuer DefaultRipple enabled: ${EXPLORER}/transactions/${issuer_setup_result.result.hash}`)
  } else {
    throw `Error sending transaction: ${issuer_setup_result}`
  }

  // Create trust line to issuer ----------------------------------------------
  const trust_result = await client.submitAndWait({
    "TransactionType": "TrustSet",
    "Account": wallet.address,
    "LimitAmount": {
      "currency": currency_code,
      "issuer": issuer.address,
      "value": "10000000000" // Large limit, arbitrarily chosen
    }
  }, {
    autofill: true, 
    wallet: wallet
  })

  // get metaData & TransactionResult
  const metaData2: any = issuer_setup_result.result.meta!;
  const transactionResult2 = metaData2.TransactionResult;

  if (transactionResult2 == "tesSUCCESS") {
    console.log(`Trust line created: ${EXPLORER}/transactions/${trust_result.result.hash}`)
  } else {
    throw `Error sending transaction: ${trust_result}`
  }

  // Issue tokens -------------------------------------------------------------
  const issue_result = await client.submitAndWait({
    "TransactionType": "Payment",
    "Account": issuer.address,
    "Amount": {
      "currency": currency_code,
      "value": issue_quantity,
      "issuer": issuer.address
    },
    "Destination": wallet.address
  }, {
    autofill: true, 
    wallet: issuer
  })

  if (transactionResult == "tesSUCCESS") {
    console.log(`Tokens issued: ${EXPLORER}/transactions/${issue_result.result.hash}`)
  } else {
    throw `Error sending transaction: ${issue_result}`
  }

  const tokenInfo: TokenInfo = {
    "currency": currency_code,
    "value": issue_quantity,
    "issuer": issuer.address
  }

  return tokenInfo;
}