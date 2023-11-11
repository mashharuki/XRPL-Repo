# DCCEX 設計書

## 開発する必要がある機能

1. SWAP機能
2. AMM Deposit機能
3. AMM withdraw機能
4. Faucet機能 (今回はプロトタイプなので)
5. カーボンクレジットFT発行機能
6. カーボンクレジットFT管理機能

## 使う技術スタック

1. Next.js
2. tailwindCSS 
3. xrpl.js
4. xumm.js
5. Web3Auth
6. supabase
7. yarn
8. monorepo

## 想定ページ

- Mainページ

  FT同士の交換およびAMM Deposit、AMM Withdraw、Faucetを行える機能。

- CreateTokenページ

  カーボンクレジットFTを新たに作るためのページ。

- ManageTokenページ

  カーボンクレジットFTの状況を確認・管理するためのページ  
  ※ issuerであれば発行および凍結ができるようにする。

## Why XRPL??

課題

- すでに各国でカーボンクレジットの取引システムが存在するものの規格(制度)は乱立している状態。(下手したら企業ごとのルールになっている)
- EVMでもUniSwapやQuickSwapなど既存のDEXは多数あるが、ペア毎に初期LPが必要だったりDEX毎に価格が変動してしまうのでユーザーは最適なレートを提供してくれるDEXを探す必要がある。

XRPLを採用することで得られるメリット

- プロトコルレベルで実装されているAMMの機能を利用することで、瞬時にDEX機能を使うことができる。(XRPLに中間ブリッジが存在している。)
- XRPLが価格の基準となり、世界レベルで活用するカーボンクレジットDEXの基盤に耐えうるものができる。(価格の基準が一つになるので各国もルール作りなどを議論しやすい。民間企業、国際機関、政府、などさまざまな団体がそれぞれの地域の性質を反映させたカーボンクレジットの規格を作成し、規格の種類が非常に多くなることを防ぐことができる)
- FTの種類が増えたとしてもXRPの流動性が確保されていればそれぞれの通貨間の流動性が落ちない
- 消費電力が少ないというXRPLのビジョンと相性が良い
- Path Findingによって最適取引をいつでも検索することが可能
- 正当でないカーボンクレジットに対して凍結が可能
- 取引が早いため電力消費とタイムラグが少なくカーボンクレジットの無効化ができるためカーボンクレジットに必須な基準を満たすことができる
- 取引が低い
- 他のDEXと異なりアービトラージの縮小によりカーボンクレジットがステーブルに保たれやすい

## カーボンクレジットの市場希望

- カーボンクレジットの市場規模は2028年には1兆6027億米ドルに達すると予想されている。
- カーボンクレジットはFTとしてブロックチェーン上で管理されるようになると考えられている。
