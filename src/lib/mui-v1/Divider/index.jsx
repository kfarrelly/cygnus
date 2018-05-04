import React, { Component } from "react"
import PropTypes from "prop-types"
import classNames from "classnames"
import { withStyles } from "material-ui-next/styles"
import Divider from "material-ui-next/Divider"




// ...
const styles = (theme) => ({
    primary: {
        backgroundColor: theme.palette.primaryLightFade,
    },
    secondary: {
        backgroundColor: theme.palette.secondaryLightFade,
    },
    common: {
        marginTop: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
    },
})


// ...
export default withStyles(styles)(
    class extends Component {

        // ...
        static propTypes = {
            classes: PropTypes.object.isRequired,
        }


        // ...
        render = () => (
            ({ classes, color, }) =>
                <Divider
                    classes={{
                        root: classNames(classes[color], classes.common),
                    }}
                />
        )(this.props)

    }
)
