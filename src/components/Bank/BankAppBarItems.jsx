import React  from "react"
import { connect } from "react-redux"
import { compose } from "redux"

import { withStyles } from "@material-ui/core/styles"
import { Typography } from "@material-ui/core"
import { handleException } from "@xcmats/js-toolbox"
import { formatFullName, pubKeyAbbr } from "../../lib/utils"
import { unknownPubKeyAbbr } from "../StellarFox/env"
import { withLoginManager } from "../LoginManager"




// <BankAppBarItems> component
export default compose(
    withLoginManager,
    withStyles({

        accountHomeDomain: { fontVariant: "small-caps", },

        appBarItems: {
            display: "block",
            color: "rgb(15,46,83)",
            fontWeight: "normal",
            "&:before": {
                content: "''",
                display: "inline-block",
                verticalAlign: "middle",
                height: "100%",
            },
        },

        appBarTitle: {
            display: "inline-block",
            verticalAlign: "middle",
        },

        barTitleAccount: {
            marginTop: "5px",
            fontSize: "1rem",
        },

        barSubtitleAccount: {
            textAlign: "center",
            fontSize: "0.8rem",
        },

    }),
    connect(
        // map state to props.
        (state) => ({
            StellarAccount: state.StellarAccount,
            publicKey: state.LedgerHQ.publicKey,
            firstName: state.Account.firstName,
            lastName: state.Account.lastName,
        })
    )
)(
    ({
        classes, publicKey, StellarAccount, firstName, lastName, loginManager,
    }) =>
        <div className={classes.appBarItems}>
            <div className={classes.appBarTitle}>
                <div className={classes.barTitleAccount}>
                    {loginManager.isAuthenticated() ?
                        <Typography align="center" variant="body2"
                            noWrap color="primary"
                        >
                            {formatFullName(firstName, lastName)}
                        </Typography> : <Typography align="center"
                            variant="body2"
                            noWrap color="primary"
                        >
                            Account
                        </Typography>
                    }
                </div>
                <div className={classes.barSubtitleAccount}>
                    {
                        StellarAccount.accountId && StellarAccount.homeDomain ?
                            <div className={classes.accountHomeDomain}>
                                {StellarAccount.homeDomain}
                            </div> :
                            <div>
                                {
                                    handleException(
                                        () => pubKeyAbbr(publicKey),
                                        () => unknownPubKeyAbbr
                                    )
                                }
                            </div>
                    }
                </div>
            </div>
        </div>
)
