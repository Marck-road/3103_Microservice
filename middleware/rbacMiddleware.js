const authPage = (permissions) => {
    return(req, res, next)=>{

        try{
            const userRole = req.user.role
            if (permissions.includes(userRole)){
                return next();
            } else{
                return res.status(401).json("Unauthorized Access");
            }
        } catch (error) {
            console.error(`Error occured: ${error.message}`);
            return res.status(400).json({error: "Unauthorized Access"});
        }
    }
}


const authUserAccess = (req, res, next) => {
    const userId = req.params.userId;
    const currentUserID = req.user.id;
    const currentUserRole = req.user.role;

    if (currentUserRole !== 'admin' && currentUserID !== userId) {
        return res.status(401).json("Unauthorized Access");
    }

    next();
};


module.exports = {
    authPage,
    authUserAccess,
};