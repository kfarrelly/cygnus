import React, { Component } from "react"
import { connect } from "react-redux"
import PropTypes from "prop-types"
import { bindActionCreators } from "redux"
import numberToText from "number-to-text"
import { withLoginManager } from "../LoginManager"
import { withAssetManager } from "../AssetManager"
import debounce from "lodash/debounce"
import { appName } from "../StellarFox/env"
import { BigNumber } from "bignumber.js"
import {
    Card,
    CardActions,
    CardText,
} from "material-ui/Card"
import {
    currencyGlyph,
} from "../../lib/utils"
import RaisedButton from "material-ui/RaisedButton"
import FlatButton from "material-ui/FlatButton"
import InputField from "../../lib/common/InputField"
import DatePicker from "material-ui/DatePicker"
import {
    togglePaymentCard,
} from "../../redux/actions"
import { action as BalancesAction } from "../../redux/Balances"
import {
    fedToPub,
    errorMessageForInvalidPaymentAddress as ErrorPaymentAddress,
    StellarSdk,
    publicKeyExists,
} from "../../lib/utils"

BigNumber.config({ DECIMAL_PLACES: 4, ROUNDING_MODE: 4, })

StellarSdk.Network.useTestNetwork()

class PaymentCard extends Component {

    // ...
    static propTypes = {
        setState: PropTypes.func.isRequired,
    }

    componentDidMount = () => {
        // reset payment variables
        const now = new Date()
        this.props.setState({
            today: now,
            payDate: now,
            amount: "",
            amountText: "",
            amountWasEntered: false,
            amountIsValid: false,
            payee: null,
            newAccount: false,
            memoRequired: false,
            memoIsValid: true,
            memoText: "",
            minimumReserveMessage: "",
            sendIsDisabled: true,
            indicatorMessage: "XXXXXXXXXXXX",
            indicatorStyle: "fade-extreme",
        })
    }

    // ...
    checkIfPaymentIsValid = () =>
        this.props.Balances.payee && this.props.Balances.amountIsValid ?
            true : false


    // ...
    enableSignButtonWhenValid = () => {
        this.props.setState({
            sendIsDisabled: !this.checkIfPaymentIsValid(),
        })
    }


    // ...
    paymentAddressValidator = () => {
        let error = ErrorPaymentAddress(
            this.textInputFieldPaymentAddress.state.value
        )
        if (error) {
            this.textInputFieldPaymentAddress.setState({
                error,
            })
            this.props.setState({
                indicatorMessage: "XXXXXXXXXXXX",
                indicatorStyle: "fade-extreme",
                payee: null,
            })
            this.enableSignButtonWhenValid()
            return false
        }
        this.textInputFieldPaymentAddress.setState({ error: "", })
        this.setRecipient()
    }


    // ...
    setRecipient = () => {
        fedToPub(this.textInputFieldPaymentAddress.state.value)
            .then(r => {
                r.ok && this.props.setState({
                    payee: r.publicKey,
                })
                this.enableSignButtonWhenValid()
                return this.updateIndicatorMessage(r.publicKey)
            })

    }


    // ...
    amountValidator = () => {
        if (!/^(\d+)([.](\d{1,2}))?$/.test(this.textInputFieldAmount.state.value)) {
            this.textInputFieldAmount.setState({
                error: "Invalid amount entered.",
            })
            this.props.setState({
                amount: this.textInputFieldAmount.state.value,
                amountWasEntered: true,
                amountIsValid: false,
                amountText: "",
            })
            this.enableSignButtonWhenValid()
            return false
        }

        if (new BigNumber(this.textInputFieldAmount.state.value).isEqualTo(0)) {
            this.textInputFieldAmount.setState({
                error: "Amount needs to be greater than zero.",
            })
            this.props.setState({
                amount: this.textInputFieldAmount.state.value,
                amountWasEntered: true,
                amountIsValid: false,
                amountText: "",
            })
            this.enableSignButtonWhenValid()
            return false
        }

        this.props.setState({
            amount: this.textInputFieldAmount.state.value,
            amountWasEntered: true,
            amountIsValid: true,
        })
        this.textInputFieldAmount.setState({
            error: "",
        })

        this.props.setState({
            amountText: this.amountToText(
                this.textInputFieldAmount.state.value),
        })
        this.enableSignButtonWhenValid()
    }


    // ...
    amountToText = (amount) => {
        const grouped = amount.match(
            /^(\d+)([.](\d{1,2}))?$/
        )
        // fractions case
        if (grouped[3]) {
            return `${numberToText.convertToText(grouped[1])} and ${
                grouped[3]}/100`
        }
        // whole amount case
        else if (grouped[1] && !grouped[2]) {
            return numberToText.convertToText(grouped[1])
        }
    }


    // ...
    memoValidator = () => {
        this.props.setState({
            memoValid: this.props.Balances.memoRequired &&
                this.textInputFieldMemo.state.value === "" ? false : true,
        })
    }

    // ...
    updateIndicatorMessage = async (publicKey) => (
        (status) => {
            status.then(s => {
                s ?
                    this.props.setState({
                        indicatorMessage: "Recipient Verified",
                        indicatorStyle: "green",
                    }) : this.props.setState({
                        indicatorMessage: "New Account",
                        indicatorStyle: "red",
                    })
            })
            return status
        }
    )(publicKeyExists(publicKey))


    // ...
    bottomIndicatorMessage = () => {
        let message = (<div className="p-l nowrap fade-extreme">
            <span className="bigger">
                𝕊𝕃{" "}{this.props.strAccount && this.props.strAccount.sequence}
            </span>
        </div>)

        if (this.props.Balances.memoRequired && !this.props.Balances.memoIsValid) {
            message = (<div className='fade p-l nowrap red'>
                <i className="material-icons md-icon-small">assignment_late</i>
                Payment recipient requires Memo entry!
            </div>)
        }

        if (this.props.Balances.minimumReserveMessage !== "") {
            message = (<div className='fade p-l nowrap red'>
                <i className="material-icons md-icon-small">assignment_late</i>
                {this.props.Balances.minimumReserveMessage}
            </div>)
        }

        return message
    }


    // ...
    updateDate = (_, date) =>
        this.props.setState({ payDate: date, })


    // ...
    hidePaymentCard = () =>
        this.props.togglePaymentCard({
            payment: {
                opened: false,
            },
        })


    // ...
    render = () => <Card className="payment-card">
        <CardText>
            <div className="f-e space-between">
                <div>
                    <div>
                        <img
                            style={{
                                opacity: "0.2",
                            }}
                            src="/img/sf.svg"
                            width="140px"
                            alt={appName}
                        />
                    </div>

                </div>
                <DatePicker
                    className="date-picker"
                    defaultDate={new Date(this.props.Balances.today)}
                    floatingLabelText="Date"
                    minDate={new Date(this.props.Balances.today)}
                    underlineShow={true}
                    onChange={this.updateDate.bind(this)}
                />
            </div>
            <div className="f-s space-between">
                <div className="payment-header f-s">
                    <div className="p-r leading-label-align nowrap">
                        Pay to the order of:
                    </div>
                    <div className="p-r">
                        <InputField
                            name="paycheck-payment-address"
                            type="text"
                            placeholder="Payment Address"
                            underlineStyle={{
                                borderColor: "rgba(15, 46, 83, 0.5)",
                            }}
                            underlineFocusStyle={{
                                borderColor: "rgba(15, 46, 83, 0.8)",
                            }}
                            inputStyle={{
                                color: "rgba(15, 46, 83, 0.8)",
                            }}
                            validator={
                                debounce(
                                    this.paymentAddressValidator,
                                    1000
                                )
                            }
                            ref={(self) => {
                                this.textInputFieldPaymentAddress = self
                            }}
                        />
                    </div>
                </div>
                <div className="payment-header f-s">
                    <div className="p-r leading-label-align payment-currency">
                        {currencyGlyph(
                            this.props.Account.currency
                        )}
                    </div>
                    <div>
                        <InputField
                            name="paycheck-payment-amount"
                            type="text"
                            validator={
                                debounce(this.amountValidator, 500)
                            }
                            ref={(self) => {
                                this.textInputFieldAmount = self
                            }}
                            placeholder="Amount"
                            underlineStyle={{
                                borderColor: "rgba(15, 46, 83, 0.5)",
                            }}
                            underlineFocusStyle={{
                                borderColor: "rgba(15, 46, 83, 0.8)",
                            }}
                            inputStyle={{
                                color: "rgba(15, 46, 83, 0.8)",
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="f-s space-between verbatim-underlined">
                <div>
                    {(this.props.Balances.amount && this.props.Balances.amountText) ?
                        (this.props.Balances.amount && this.props.Balances.amountText) :
                        <span className="transparent">NOTHING</span>}
                </div>
                <div>
                    {this.props.assetManager.getAssetDenomination(
                        this.props.Account.currency)}
                </div>
            </div>
            <div className="p-t"></div>
            <div className="f-e">
                <div>
                    <i className="material-icons">lock</i>
                </div>
                <div className="micro nowrap">
                    <span>Security Features</span><br />
                    <span className={this.props.Balances.indicatorStyle}>
                        {this.props.Balances.indicatorMessage}
                    </span>

                </div>

            </div>
            <div className="p-b"></div>
            <div className="f-s space-between">
                <div>
                    <span className="payment-header">
                        <span className="p-r">For:</span>
                        <InputField
                            name="paycheck-memo"
                            type="text"
                            placeholder="Memo"
                            underlineStyle={{
                                borderColor: "rgba(15, 46, 83, 0.5)",
                            }}
                            underlineFocusStyle={{
                                borderColor: "rgba(15, 46, 83, 0.8)",
                            }}
                            inputStyle={{
                                color: "rgba(15, 46, 83, 0.8)",
                            }}
                            ref={(self) => {
                                this.textInputFieldMemo = self
                            }}
                            validator={
                                debounce(this.memoValidator, 500)
                            }
                        />
                    </span>
                </div>
            </div>
        </CardText>
        <CardActions>
            <div className="f-e space-between">

                {this.bottomIndicatorMessage.call(this)}

                <div>
                    <span className="p-r">
                        <RaisedButton
                            onClick={this.sendPayment}
                            backgroundColor="rgb(15,46,83)"
                            labelColor="rgb(244,176,4)"
                            label="SIGN"
                            disabledBackgroundColor="rgba(15,46,83,0.3)"
                            disabledLabelColor="#cfd8dc"
                            disabled={
                                this.props.Balances.sendIsDisabled
                            }
                        />
                    </span>
                    <FlatButton
                        label="CANCEL"
                        disableTouchRipple={true}
                        disableFocusRipple={true}
                        onClick={this.hidePaymentCard}
                    />
                </div>
            </div>
            <div className="p-b"></div>
        </CardActions>
    </Card>
}


// ...
export default withLoginManager(withAssetManager(connect(
    // map state to props.
    (state) => ({
        Account: state.Account,
        Assets: state.Assets,
        Balances: state.Balances,
        strAccount: (state.accountInfo.account ? state.accountInfo.account.account : null),
        appUi: state.appUi,
    }),

    // map dispatch to props.
    (dispatch) => bindActionCreators({
        setState: BalancesAction.setState,
        togglePaymentCard,

    }, dispatch)
)(PaymentCard)))