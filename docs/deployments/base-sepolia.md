# Base Sepolia deployment

This is the canonical public deployment record for the TrustWork portfolio escrow. It records testnet infrastructure only and is not an endorsement for real-money use.

## Contract

| Field | Value |
| --- | --- |
| Network | Base Sepolia |
| Chain ID | `84532` |
| Contract | `FreelanceEscrow` |
| Address | [`0xCB9A7C320a46fa8FA091C7E74DD192df2fb6Ce81`](https://sepolia.basescan.org/address/0xCB9A7C320a46fa8FA091C7E74DD192df2fb6Ce81) |
| Deployment transaction | [`0x666ef36845f536f190228f934453a1a3b694de1669e3614b8444f7f36268b7b9`](https://sepolia.basescan.org/tx/0x666ef36845f536f190228f934453a1a3b694de1669e3614b8444f7f36268b7b9) |
| Deployment block | `45824805` |
| Source commit | `72384556a5118431075786f765d4f1b6a9b8ef3f` |
| Verification | [Sourcify exact match](https://sourcify.dev/server/v2/verify/21331f04-8adc-4430-8576-fdb03478df7a) |

## Constructor configuration

| Field | Value |
| --- | --- |
| Accepted token | Official Base Sepolia test USDC — `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Deployer | `0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470` |
| Admin | `0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470` |
| Initial arbitrator | `0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470` |
| Fee recipient | `0x407B1Ed9dE0DcE663c08879cC47F10dae0E3f470` |
| Platform fee | `500` basis points (`5%`) |
| Maximum job amount | `10,000,000,000` raw units (`10,000` test USDC) |

## Independent read-back

After deployment, RPC reads confirmed that the address contains `12,032` bytes of runtime bytecode and that `acceptedToken`, `feeRecipient`, `platformFeeBps`, and `maxJobAmount` match the constructor configuration above.

## Limitations

- Base Sepolia testnet only; all assets have no monetary value.
- Exact-match source verification is not an external security audit.
- The contract is not approved for mainnet or commercial use.
- Provider deployment, indexed public seed jobs, and end-to-end smoke testing remain pending.
