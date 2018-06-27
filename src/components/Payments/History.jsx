import React, { Component, Fragment } from "react"
import PropTypes from "prop-types"
import {
    bindActionCreators,
    compose,
} from "redux"
import { connect } from "react-redux"
import { withStyles } from "@material-ui/core/styles"
import {
    utcToLocaleDateTime,
} from "../../lib/utils"
import {
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TablePagination,
    TableRow,
    IconButton,
    Typography,
} from "@material-ui/core"
import {
    KeyboardArrowLeft,
    KeyboardArrowRight,
} from "@material-ui/icons"
import FirstPageIcon from "@material-ui/icons/FirstPage"
import LastPageIcon from "@material-ui/icons/LastPage"
import StellarSdk from "stellar-sdk"
import {
    credit, debit, displayCredit, displayDebit,
} from "../../lib/stellar-tx"
import TransactionDetails from "./TransactionDetails"



// ...
const styles = theme => ({
    root: {
        flexShrink: 0,
        color: theme.palette.text.secondary,
        marginLeft: theme.spacing.unit * 2.5,
    },
    progress: {
        color: theme.palette.primary.fade,
        marginRight: theme.spacing.unit,
    },
})




// ...
class TablePaginationActions extends React.Component {

    // ...
    handleFirstPageButtonClick = (event) =>
        this.props.onChangePage(event, 0)


    // ...
    handleBackButtonClick = (event) =>
        this.props.onChangePage(event, this.props.page - 1)


    // ...
    handleNextButtonClick = (event) =>
        this.props.onChangePage(event, this.props.page + 1)


    // ...
    handleLastPageButtonClick = event =>
        this.props.onChangePage(
            event,
            Math.max(0, Math.ceil(
                this.props.count / this.props.rowsPerPage
            ) - 1),
        )


    // ...
    render () {
        const { classes, count, page, rowsPerPage, theme, } = this.props

        return (
            <div className={classes.root}>
                <IconButton
                    onClick={this.handleFirstPageButtonClick}
                    disabled={page === 0}
                    aria-label="First Page"
                >
                    {theme.direction === "rtl" ?
                        <LastPageIcon /> : <FirstPageIcon />}
                </IconButton>
                <IconButton
                    onClick={this.handleBackButtonClick}
                    disabled={page === 0}
                    aria-label="Previous Page"
                >
                    {theme.direction === "rtl" ?
                        <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                </IconButton>
                <IconButton
                    onClick={this.handleNextButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                    aria-label="Next Page"
                >
                    {theme.direction === "rtl" ?
                        <KeyboardArrowLeft /> : <KeyboardArrowRight />}
                </IconButton>
                <IconButton
                    onClick={this.handleLastPageButtonClick}
                    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                    aria-label="Last Page"
                >
                    {theme.direction === "rtl" ?
                        <FirstPageIcon /> : <LastPageIcon />}
                </IconButton>
            </div>
        )
    }
}




// ...
TablePaginationActions.propTypes = {
    classes: PropTypes.object.isRequired,
    count: PropTypes.number.isRequired,
    onChangePage: PropTypes.func.isRequired,
    page: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    theme: PropTypes.object.isRequired,
}




// ...
const TablePaginationActionsWrapped = withStyles(
    styles,
    { withTheme: true, }
)(TablePaginationActions)




// ...
const TableHeaderCell = withStyles((theme) => ({
    head: {
        backgroundColor: theme.palette.secondary.main,
        borderBottom: `2px solid ${theme.palette.primary.fade}`,
        color: theme.palette.primary.main,
    },
    root: {
        fontSize: "1rem",
    },
}))(TableCell)




// ...
const RequestProgress = withStyles(styles)(
    ({ classes, }) =>
        <CircularProgress className={classes.progress}
            thickness={4} size={40}
        />
)




// <UserGroupList> component
export default compose(
    withStyles((theme) => ({
        table: {
            minWidth: 500,
            marginTop: theme.spacing.unit * 2,
        },
        tableWrapper: {
            overflowX: "auto",
        },
        row: {
            cursor: "pointer",
            "&:nth-of-type(even)": {
                backgroundColor: theme.palette.secondary.light,
            },
            "&:nth-of-type(odd)": {
                backgroundColor: theme.palette.secondary.main,
            },
            "&:hover": {
                backgroundColor: "rgba(246, 190, 49, 0.95)",
            },
        },
        cell: {
            borderBottom: "none",
            color: theme.palette.primary.main,
        },
        pagination: {
            color: theme.palette.secondary.main,
            fontSize: "0.75rem",
        },
        selectIcon: {
            paddingBottom: "2px",
            color: theme.palette.secondary.main,
        },
        actions: {
            color: theme.palette.secondary.main,
        },
    })),
    connect(
        // map state to props.
        (state) => ({
            authToken: state.Auth.authToken,
            horizon: state.StellarAccount.horizon,
            publicKey: state.StellarAccount.accountId,
        }),
        // match dispatch to props.
        (dispatch) => bindActionCreators({ /* ... */ }, dispatch)
    )
)(class extends Component {

    // ...
    static propTypes = {
        classes: PropTypes.object.isRequired,
    }

    state = {
        page: 0,
        rowsPerPage: 5,
        loading: true,
        error: false,
        errorMessage: "",
        data: [],
        detailsData: [],
    }


    // ...
    componentDidMount = () => {
        new StellarSdk.Server(this.props.horizon)
            .transactions()
            .forAccount(this.props.publicKey)
            .order("desc")
            .limit(100)
            .call()
            .then((accountResult) => {
                const data = accountResult.records.map((r, key) => {
                    let transaction = StellarSdk.xdr.Transaction.fromXDR(
                        r.envelope_xdr, "base64"
                    )
                    let meta = StellarSdk.xdr.TransactionMeta.fromXDR(
                        r.result_meta_xdr, "base64"
                    )
                    let txresult = StellarSdk.xdr.TransactionResult.fromXDR(
                        r.result_xdr, "base64"
                    )
                    let operations = transaction.operations().map(
                        (op) => StellarSdk.Operation.fromXDRObject(op)
                    )

                    return { key, transaction, operations, meta, txresult, r, }
                })

                this.setState({ data, loading: false, })

            })
            .catch((error) => {
                this.setState({
                    error: true,
                    errorMessage: error.message,
                    loading: false,
                })
            })
    }


    // ...
    handleChangePage = (_event, page) => {
        this.setState({ page, })
    }


    // ...
    handleChangeRowsPerPage = (event) =>
        this.setState({ rowsPerPage: event.target.value, })


    // ...
    handleRowClick = (detailsData) => {
        this.setState({ detailsData, })
    }


    // ...
    render = () => (
        ({ classes, }) => {
            const { rowsPerPage, page, data, } = this.state
            const emptyRows = rowsPerPage - Math.min(
                rowsPerPage, data.length - page * rowsPerPage)



            return (<Fragment><div className={classes.tableWrapper}>
                <Table className={classes.table}>
                    <TableHead>
                        <TableRow>
                            <TableHeaderCell>Date</TableHeaderCell>
                            <TableHeaderCell>Transaction Details</TableHeaderCell>
                            <TableHeaderCell>Amount</TableHeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.slice(
                            page * rowsPerPage, page * rowsPerPage +
                            rowsPerPage).map(n => {

                            let debitVal = debit(n.operations, this.props.publicKey)
                            let creditVal = credit(n.operations, this.props.publicKey)

                            return (
                                <TableRow className={classes.row}
                                    onClick={this.handleRowClick.bind(
                                        this, n
                                    )}
                                    key={n.key}
                                >
                                    <TableCell
                                        classes={{ root: classes.cell, }}
                                        component="th" scope="row"
                                    >
                                        {utcToLocaleDateTime(n.r.created_at)}
                                    </TableCell>
                                    <TableCell
                                        classes={{ root: classes.cell, }}
                                    >
                                        {n.r.memo}
                                    </TableCell>
                                    <TableCell
                                        classes={{ root: classes.cell, }}
                                    >
                                        <span className="error">
                                            {displayDebit(debitVal)}
                                        </span>
                                        <span className="success">
                                            {displayCredit(creditVal)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {emptyRows > 0 && (
                            <TableRow className={classes.row}
                                style={{ height: 48 * emptyRows, }}
                            >
                                <TableCell className={classes.cell} colSpan={5}>
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignContent: "flex-start",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                    >
                                        {this.state.loading &&
                                            <RequestProgress />
                                        }
                                        {this.state.error &&
                                            (<Fragment>
                                                <Typography variant="title">
                                                    Hmm. We're having trouble fetching this data.
                                                </Typography>
                                                <Typography variant="caption">
                                                    {this.state.errorMessage}
                                                </Typography>
                                            </Fragment>)
                                        }
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                classes={{
                                    caption: classes.pagination,
                                    select: classes.pagination,
                                    selectIcon: classes.selectIcon,
                                    toolbar: classes.actions,
                                }}
                                colSpan={5}
                                count={data.length}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[ 5, 10, 15, ]}
                                page={page}
                                onChangePage={this.handleChangePage}
                                onChangeRowsPerPage={
                                    this.handleChangeRowsPerPage
                                }
                                ActionsComponent={
                                    TablePaginationActionsWrapped
                                }
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
            <TransactionDetails data={this.state.detailsData} />
            </Fragment>)
        }
    )(this.props)

})