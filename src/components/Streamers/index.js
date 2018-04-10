import {
    fetchAccount,
    operations,
    payments,
} from "../../lib/stellar-tx"



// ...
export const paymentsStreamer = (publicKey, changeSnackbarState, accountExistsOnLedger) =>
    payments().stream({
        onmessage: (message) => {

            const RECEIVED = [
                (message.type === "create_account" &&
                    message.account === publicKey),
                (message.type === "payment" &&
                    message.to === publicKey),
            ]

            const SENT = [
                (message.type === "create_account" &&
                    message.source_account === publicKey),
                (message.type === "payment" &&
                    message.from === publicKey),
            ]

            RECEIVED.some(el => el) && changeSnackbarState({
                open: true,
                message: "Payment received.",
            }) && fetchAccount(publicKey).then(
                account => accountExistsOnLedger({ account, })
            )

            SENT.some(el => el) && changeSnackbarState({
                open: true,
                message: "Payment sent.",
            }) && fetchAccount(publicKey).then(
                account => accountExistsOnLedger({ account, })
            )
        },
    })


// ...
export const operationsStreamer = (publicKey, changeSnackbarState, accountExistsOnLedger) =>
    operations().stream({
        onmessage: (message) => {
            const HOME_DOMAIN_ADD = [
                (message.type === "set_options" &&
                    message.source_account === publicKey &&
                    message.home_domain
                ),
            ]

            const HOME_DOMAIN_REMOVE = [
                (message.type === "set_options" &&
                    message.source_account === publicKey &&
                    !message.home_domain
                ),
            ]

            HOME_DOMAIN_ADD.some(el => el) && changeSnackbarState({
                open: true,
                message: "Account domain updated.",
            }) && fetchAccount(publicKey).then(
                account => accountExistsOnLedger({ account, })
            )

            HOME_DOMAIN_REMOVE.some(el => el) && changeSnackbarState({
                open: true,
                message: "Account domain removed.",
            }) && fetchAccount(publicKey).then(
                account => accountExistsOnLedger({ account, })
            )
        },
    })