import { useState, useEffect, useContext } from 'react';
import { NearContext } from '@/wallets/near';
import styles from '@/styles/app.module.css';

// Contract address
const CONTRACT = 'partage-lock.testnet';

export default function Shop() {
  const { signedAccountId, wallet } = useContext(NearContext);
  const [ownsToken, setOwnsToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receiverId, setReceiverId] = useState('');

  useEffect(() => {
    if (signedAccountId && wallet) {
      checkTokenOwnership();
    }
  }, [signedAccountId, wallet]);

  const checkTokenOwnership = async () => {
    if (!wallet) return;
    try {
      const result = await wallet.ownsToken(signedAccountId, CONTRACT);
      setOwnsToken(result);
      setIsLoading(false); // reset loading state
    } catch (error) {
      console.error('Error checking token ownership:', error);
      setError('Failed to check token ownership');
      setIsLoading(false); // reset loading state
    }
  };

  const mintNFT = async () => {
    if (!wallet || !signedAccountId) return;
    setIsLoading(true);
    setError(null);
    try {
      await wallet.callMethod({
        contractId: CONTRACT,
        method: 'nft_mint',
        args: { 
          token_owner_id: signedAccountId,
          token_metadata: {
            title: "Exlusive Fans Token",
            description: "Your exclusive fans token to access exclusive content from the fans club",
          },
        },
        deposit: '100000000000000000000000', // 0.1 NEAR in yoctoNEAR for storage cost - adjust this based on your contract's requirements
      });
      alert('Fans Token on its way to your wallet!');
      await checkTokenOwnership(); //refresh ownership status
    } catch (error) {
      console.error('Error minting fans token:', error);
      setError('Failed to mint fans token. Try again later');
    } finally {
    setIsLoading(false); // ensure isLoading is set back to false
    }
  };

  const transferNFT = async () => {
    if (!wallet || !ownsToken) return;
    setIsLoading(true);
    setError(null);
    try {
      await wallet.callMethod({
        contractId: CONTRACT,
        method: 'nft_transfer',
        args: { 
          receiver_id: receiverId,
          approval_id: null, // optional approval ID
          memo: 'Transfer fans token from the shop',
        },
        deposit: '1', // minimal deposit required for transfer
      });
      alert('Fans Token transferred successfully!');
      await checkTokenOwnership(); //refresh ownership status
    } catch (error) {
      console.error('Error transferring fans token:', error);
      setError('Failed to transfer fans token. Check receiver ID or try again later');
    }
    setIsLoading(false);
  }

  return (
    <main className={styles.main}>
      <div className={styles.center}>
        {signedAccountId ? (
          <h1>Do you own a fans token? {ownsToken ? 'Yes' : 'No'}</h1>
        ) : (
          <h1>Please login to check your fans token</h1>
        )}
      </div>
      <div className={`${styles.center} ${styles.shopContainer}`}>
        {signedAccountId ? (
          <>
            {!ownsToken ? (
              <div className={styles.shopSection}>
                <h2>Claim your Fans Token</h2>
                <button onClick={mintNFT} disabled={isLoading}>
                  {isLoading ? 'Minting...' : 'Claim'}
                </button>
              </div>
            ) : (
              <div className={styles.shopSection}>
                <h2>Transfer your Fans Token</h2>
                <input
                  type="text"
                  placeholder="Receiver ID"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)} // store receiver ID in state
                />
                <button onClick={transferNFT} disabled={isLoading || !receiverId}>
                  {isLoading ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            )}
          </>
        ) : null}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </main>
  );
}