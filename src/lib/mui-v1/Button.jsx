import React, { Component } from "react"
import PropTypes from "prop-types"
import classNames from "classnames"

import { withStyles } from "@material-ui/core/styles"
import { Button } from "@material-ui/core"




// <CustomButton> component
export default withStyles((theme) => ({

    awesome: {
        color: "white",
        background: "linear-gradient(30deg, rgb(178, 34, 34) 10%, rgb(244, 176, 4) 100%)",
        "&:hover": {
            backgroundColor: theme.palette.primaryHighlight,
        },
    },

    primary: {
        color: theme.palette.secondaryColor,
        backgroundColor: theme.palette.primaryColor,
        "&:hover": {
            backgroundColor: theme.palette.primaryHighlight,
        },
    },

    secondary: {
        color: theme.palette.primaryColor,
        backgroundColor: theme.palette.secondaryColor,
        "&:hover": {
            backgroundColor: theme.palette.secondaryHighlight,
        },
    },

    success: {
        color: theme.palette.success,
        backgroundColor: theme.palette.primaryColor,
        "&:hover": {
            backgroundColor: theme.palette.successHighlight,
            textShadow: `0px 0px 20px ${theme.palette.success}`,
        },
    },

    warning: {
        color: theme.palette.warning,
        backgroundColor: theme.palette.primaryColor,
        "&:hover": {
            backgroundColor: theme.palette.warningHighlight,
            textShadow: `0px 0px 40px ${theme.palette.warning}`,
        },
    },

    danger: {
        color: theme.palette.danger,
        backgroundColor: theme.palette.primaryColor,
        "&:hover": {
            backgroundColor: theme.palette.dangerHighlight,
            textShadow: `0px 0px 20px ${theme.palette.danger}`,
        },
    },

    common: {
        borderRadius: "2px",
        transition: "text-shadow 350ms ease-out, background-color 350ms ease",
        boxShadow: "0 3px 7px rgba(0, 0, 0, 0.3)",
        marginRight: "0.5rem",
        "&:last-child": {
            marginLeft: "0rem",
            marginRight: "0rem",
        },
    },

    disabled: {
        color: `${theme.palette.disabledColor} !important`,
        backgroundColor: `${theme.palette.disabledBackgroundColor} !important`,
    },

}))(
    class extends Component {

        // ...
        static propTypes = {
            classes: PropTypes.object.isRequired,
        }


        // ...
        render = () => (
            ({ children, classes, color, disabled, fullWidth, onClick, }) =>
                <Button
                    variant="raised"
                    className={
                        classNames(
                            disabled ? classes.disabled : classes[color],
                            classes.common,
                        )
                    }
                    onClick={onClick}
                    disabled={disabled}
                    fullWidth={fullWidth}

                >
                    { children ? children : "Button" }
                </Button>
        )(this.props)

    }
)
