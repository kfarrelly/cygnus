import React, {Component} from 'react'
import './Balances.css'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog';
import SnackBar from '../frontend/snackbar/SnackBar'
import axios from 'axios'
import {formatAmount} from '../lib/utils'
import {config} from '../config'
import {
  setExchangeRate,
  showAlert,
  hideAlert,
  setCurrency,
  setStreamer,
  setCurrencyPrecision,
  accountExistsOnLedger,
  accountMissingOnLedger,
} from '../actions/index'

class Balances extends Component {
  constructor(props) {
    super(props)
    this.state = {
      sbPayment: false,
      sbPaymentAmount: null,
      sbPaymentAssetCode: null,
    }
  }

  componentDidMount() {
    if (this.props.auth.isAuthenticated) {
      axios.get(`${config.api}/account/${this.props.auth.userId}`)
        .then((response) => {
          this.props.setCurrency(response.data.data.currency)
          this.props.setCurrencyPrecision(response.data.data.precision)
          this.getExchangeRate(response.data.data.currency)
        })
        .catch((error) => {
          console.log(error.message)
        })
    } else {
      this.getExchangeRate(this.props.accountInfo.currency)
    }
    this.props.setStreamer(this.paymentsStreamer.call(this))
  }

  componentWillUnmount() {
    this.props.accountInfo.streamer.call(this)
  }

  paymentsStreamer() {
    let server = new window.StellarSdk.Server(this.props.accountInfo.horizon)
    return server.payments()
      .cursor('now')
      .stream({
        onmessage: (message) => {
          /*
          * Initial Account Funding
          */
          if (message.type === 'create_account' && message.account === this.props.accountInfo.pubKey) {
            this.updateAccount.call(this)
            this.setState({
              sbPayment: true,
              sbPaymentText: 'Account Funded: ',
              sbPaymentAmount: formatAmount(
                message.starting_balance, this.props.accountInfo.precision),
              sbPaymentAssetCode: 'XLM'
            })
          }

          /*
          * Receiving Payment
          */
          if (message.type === 'payment' && message.to === this.props.accountInfo.pubKey) {
            this.updateAccount.call(this)
            this.setState({
              sbPayment: true,
              sbPaymentText: 'Payment Received: ',
              sbPaymentAmount: formatAmount(
                message.amount, this.props.accountInfo.precision),
              sbPaymentAssetCode: (
                message.asset_type === 'native' ? 'XLM' : message.asset_code)
            })
          }

          /*
          * Sending Payment
          */
          if (message.type === 'payment' && message.from === this.props.accountInfo.pubKey) {
            this.updateAccount.call(this)
            this.setState({
              sbPayment: true,
              sbPaymentText: 'Payment Sent: ',
              sbPaymentAmount: formatAmount(
                message.amount, this.props.accountInfo.precision),
              sbPaymentAssetCode: (
                message.asset_type === 'native' ? 'XLM' : message.asset_code)
            })
          }

        }
      })
  }

  updateAccount() {
    let server = new window.StellarSdk.Server(this.props.accountInfo.horizon)
    server.loadAccount(this.props.accountInfo.pubKey)
      .catch(window.StellarSdk.NotFoundError, function (error) {
        throw new Error('The destination account does not exist!');
      })
      .then((account) => {
        this.props.accountExistsOnLedger({account})
      }, (e) => {
        this.props.accountMissingOnLedger()
      })
  }

  getNativeBalance(account) {
    let nativeBalance = 0
    account.balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        nativeBalance = balance.balance
      }
    })
    return nativeBalance
  }

  exchangeRateFetched() {
    if (
      this.props.accountInfo.rates !== undefined &&
      this.props.accountInfo.rates[this.props.accountInfo.currency] !== undefined
    ) {
      return true
    }
    return false
  }

  exchangeRateStale() {
    if (
      this.props.accountInfo.rates === undefined ||
      this.props.accountInfo.rates[this.props.accountInfo.currency] === undefined ||
      this.props.accountInfo.rates[this.props.accountInfo.currency].lastFetch + 300000 < Date.now()
    ) {
      return true
    }
    return false
  }

  getExchangeRate(currency) {
    if (this.exchangeRateStale()) {
      axios.get(`${config.api}/ticker/latest/${currency}`)
      .then((response) => {
        this.props.setExchangeRate({[currency]: {
          rate: response.data.data[`price_${currency}`],
          lastFetch: Date.now()
        }})
      })
      .catch(function (error) {
        console.log(error.message)
      })
    }
  }

  getOtherBalances(account) {
    return account.balances.map((balance) => {
      if (balance.asset_type !== 'native') {
        return (
          <p className='other-assets' key={balance.asset_code}>
            <span className='other-asset-balance'>
              {
                Number.parseFloat(balance.balance)
                  .toFixed(this.props.accountInfo.precision)
              }
            </span>
            <span className='other-asset-code'>
              {balance.asset_code}
            </span>
          </p>
        )
      }
      return undefined
    })
  }

  handleOpen = () => {
    this.props.showAlert()
  }

  handleClose = () => {
    this.props.hideAlert()
  }

  handlePaymentSnackBarClose = () => {
    this.setState({
      sbPayment: false
    })
  }

  render() {
    let otherBalances
    if (this.props.accountInfo.exists) {
      otherBalances = this.getOtherBalances.call(
        this, this.props.accountInfo.account.account
      )
    }

    const actions = [
      <RaisedButton
        backgroundColor="rgb(15,46,83)"
        labelColor="rgb(244,176,4)"
        label="OK"
        keyboardFocused={true}
        onClick={this.handleClose}
      />,
    ]

    return (
      <div>
        <div>
          <SnackBar
            open={this.state.sbPayment}
            message={`${this.state.sbPaymentText} ${this.state.sbPaymentAmount} ${this.state.sbPaymentAssetCode}`}
            onRequestClose={this.handlePaymentSnackBarClose.bind(this)}
          />
          <Dialog
            title="Not Yet Implemented"
            actions={actions}
            modal={false}
            open={this.props.modal.isShowing}
            onRequestClose={this.handleClose}
            paperClassName="modal-body"
            titleClassName="modal-title"
          >
            Pardon the mess. We are working hard to bring you this feature very
            soon. Please check back in a while as the feature implementation
            is being continuously deployed.
          </Dialog>
        </div>
        {this.props.accountInfo.exists ? (
          <div>
            <Card className='account'>
              <CardHeader
                title={
                  <span>
                    <span>Current Balance </span>
                    <i className="material-icons">hearing</i>
                  </span>
                }
                subtitle="Stellar Lumens"
                actAsExpander={true}
                showExpandableButton={true}
              />
              <CardText>
                <div className='flex-row'>
                  <div>
                    <div className='balance'>
                      {this.exchangeRateFetched() ?
                        (Number.parseFloat(this.getNativeBalance.call(
                          this, this.props.accountInfo.account.account
                        )) * Number.parseFloat(
                          this.props.accountInfo.rates[this.props.accountInfo.currency].rate)
                        ).toFixed(2) : '0.00'
                      } {this.props.accountInfo.currency.toUpperCase()}
                    </div>
                    <div>
                      {Number.parseFloat(this.getNativeBalance.call(
                        this, this.props.accountInfo.account.account
                      )).toFixed(this.props.accountInfo.precision)} XLM
                    </div>
                  </div>
                  <div></div>
                </div>
              </CardText>
              <CardActions>
                <RaisedButton
                  backgroundColor="rgb(15,46,83)"
                  labelColor="#228B22"
                  label="Deposit"
                  onClick={this.handleOpen.bind(this)}
                />
                <RaisedButton
                  backgroundColor="rgb(15,46,83)"
                  labelColor="rgb(244,176,4)"
                  label="Request"
                  onClick={this.handleOpen.bind(this)}
                />
                {this.props.auth.isReadOnly ? null :
                  <RaisedButton
                    backgroundColor="rgb(15,46,83)"
                    labelColor="#d32f2f"
                    label="Send"
                    onClick={this.handleOpen.bind(this)}
                  />
                }
              </CardActions>
              <CardText expandable={true}>
                <div>
                  <div>Other Assets</div>
                  <div>
                    {otherBalances[0] !== undefined ?
                      otherBalances : <div className='faded'>
                        You currently do not own any other assets.
                      </div>
                    }
                  </div>
                </div>
              </CardText>
            </Card>
          </div>
        ) : (
          <Card className='account'>
            <CardHeader
              title="Current Balance"
              subtitle="Stellar Lumens"
              actAsExpander={false}
              showExpandableButton={false}
            />
            <CardText>
              <div className='balance'>
                0 XLM
              </div>
              <div className='faded'>
                0 {this.props.accountInfo.currency.toUpperCase()}
              </div>
            </CardText>
            <CardActions>
              <RaisedButton
                onClick={this.handleOpen.bind(this)}
                backgroundColor="rgb(15,46,83)"
                labelColor="rgb(244,176,4)"
                label="Deposit" />
            </CardActions>
            <CardText>
              <div className='faded'>
                <i className="material-icons md-icon-small">info_outline</i>
                Your account is currently inactive. Please deposit required
                minimum reserve of 1 XLM in order to activate it.
              </div>
            </CardText>
          </Card>
          )}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    accountInfo: state.accountInfo,
    auth: state.auth,
    modal: state.modal,
  }
}

function matchDispatchToProps(dispatch) {
  return bindActionCreators({
    setExchangeRate,
    showAlert,
    hideAlert,
    setCurrency,
    setStreamer,
    setCurrencyPrecision,
    accountExistsOnLedger,
    accountMissingOnLedger,
  }, dispatch)
}

export default connect(mapStateToProps, matchDispatchToProps)(Balances)
