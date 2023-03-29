import {
    Client, Mnemonic
} from "@hashgraph/sdk";
import {
    accountInfo,
} from "./ApiService";
import {Network} from "./models/Networks";
import StringHelpers from "./helpers/StringHelpers";
import {CustomError} from "./models/Errors";

export class GarySDK {
    private apiKey: string = "";
    private network: Network = Network.Testnet;

    init(apiKey: string, network: string, dAppCode: string, fingerprint: string, completionKey: string) {
        this.apiKey = apiKey;
        this.network = StringHelpers.stringToNetwork(network);

        return this.sendMessageToNative(completionKey, {status: "success"});
    }

    accountInfo(accountId: string, completionKey: string) {
        return accountInfo(this.network, accountId)
            .then(data => {
                return this.sendMessageToNative(completionKey, data);
            }).catch(error => {
                return this.sendMessageToNative(completionKey, null, error);
            });
    }

    async generateKeys(completionKey: string) {
        const mnemonic = await Mnemonic.generate12();
        const privateKey = await mnemonic.toEcdsaPrivateKey();

        return this.sendMessageToNative(completionKey, {
            mnemonic: mnemonic.toString(),
            privateKey: privateKey.toStringDer(),
            pubclicKey: privateKey.publicKey.toStringDer()
        });
    }



    private getClient() {
        return this.network === Network.Testnet ? Client.forTestnet() : Client.forMainnet();
    }

    private sendMessageToNative(completionKey: string, data: any | null, error: Partial<CustomError>|any|null = null) {
        const responseObject = {
            completionKey: completionKey,
            data: data
        };
        if (error) {
            responseObject["error"] = {
                name: error?.name || "Error",
                reason: error.reason || error.message || JSON.stringify(error)
            };
        }

        // @ts-ignore  // IOS or Android
        const garyMessageHandler = window?.webkit?.messageHandlers?.garyMessageHandler || window?.garyMessageHandler;
        if (garyMessageHandler) {
            garyMessageHandler.postMessage(JSON.stringify(responseObject));
        }
        return JSON.parse(JSON.stringify(responseObject));
    }
}

if (window) window["garySDK"] = new GarySDK();
