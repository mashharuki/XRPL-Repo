import { GlobalContext } from '@/context/GlobalProvider';
import { WS_URL } from "@/utils/consts";
import { getEnv } from "@/utils/getEnv";
import React, { createContext, useContext, useState } from 'react';
import { Client, dropsToXrp } from 'xrpl';
import { Xumm } from "xumm";

// XRPLインスタンスを作成
const client = new Client(WS_URL);
export const XummContext = createContext<any>({});

/**
 * XummProvider
 * @param param0 
 * @returns 
 */
export const XummProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const [address, setAddress] = useState<string | null>();
  const [balance, setBalance] = useState<string | null>();
  const [xumm, setXumm] = useState<Xumm | null>();

  const globalContext = useContext(GlobalContext);

  /**
   * 初期化＆認証メソッド
   */
  const login = async():Promise<any> => {
    // get env
    const { XRP_API_KEY } = await getEnv();
    // XUMM用のインスタンスを作成する。
    const newXumm = new Xumm(XRP_API_KEY);

    try {
      globalContext.setLoading(true)

      // authorize
      await newXumm.authorize();
      const account = await newXumm.user.account;
      const userInfo = await newXumm.user;
      console.log("user info:", userInfo);
      console.log("account address:", account);
  
      setAddress(account);
      setXumm(newXumm);
      await getAccountInfo(account!);
    } catch(err) {
      console.error("eer:", err)
    } finally {
      globalContext.setLoading(false)
    }
  }

  /**
   * アカウント情報を取得するメソッド
   */
  const getAccountInfo = async(
    address: string
  ) => {
    try {
      // Connect to the client   
      await client.connect();
      
      const {
        result: { account_data },
      }: any = await client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated',
      });

      const newBalance = dropsToXrp(account_data.Balance);
      console.log("account's balance: ", newBalance)

      setBalance(newBalance);
    } catch (error) {
      console.error("err", error);
    } finally {
      await client.disconnect();
    }
  };

  // 状態と関数をオブジェクトにラップして、プロバイダーに引き渡す
  const global = {
    address,
    balance,
    xumm,
    login
  }

  return (
    <XummContext.Provider value={global}>
      {children}
    </XummContext.Provider>
  )
}