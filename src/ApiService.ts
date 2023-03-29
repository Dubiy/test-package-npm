import {AccountId} from "@hashgraph/sdk";
import {Network, NetworkMirrorNodes} from "./models/Networks";

const fetchWithRetry = async (url, options, maxAttempts = 3) => {
    return new Promise((resolve, reject) => {
        let attemptCounter = 0;

        const interval = 5000;
        const makeRequest = (url, options) => {
            attemptCounter += 1;
            fetch(url, options)
                .then(async (res) => {
                    if (!res.ok) {
                        // Request timeout check
                        if ((res.status === 408 || res.status === 429) && attemptCounter < maxAttempts) {
                            /* istanbul ignore next */
                            setTimeout(() => {
                                makeRequest(url, options);
                            }, interval * attemptCounter);
                        } else {
                            const result = await res.json()
                            result['url'] = res.url;
                            reject(result);
                        }
                    } else {
                        resolve(res);
                    }
                });
        };
        makeRequest(url, options);
    });
};

const statusCheck = async (res) => {
    if (!res.ok) {
        throw await res.json();
    }
    return res;
};

export const GET = (network: Network, route: string) => {
    return fetchWithRetry(`${NetworkMirrorNodes[network]}/${route}`, {})
        .then(statusCheck)
        .then(x => x.json());
};

export const accountInfo = async (network: Network, accountId: string): Promise<{ evmAddress: string, publicKey: string }> => {
    const accountInfo = await GET(network, `api/v1/accounts/${accountId}`);
    return {
        evmAddress: accountInfo.evm_address ? accountInfo.evm_address : `0x${AccountId.fromString(accountId).toSolidityAddress()}`,
        publicKey: accountInfo.key.key
    };
}
