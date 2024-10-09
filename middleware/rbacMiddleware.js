const { failedAuthCounter } = require('./metricsMiddleware'); 

const authPage = (permissions) => {
    return (req, res, next) => {
        try {
            const userRole = req.user.role;
        
            if (permissions.includes(userRole)) {
                return next();
            } else {
                failedAuthCounter.inc({ method: req.method, path: req.path }); // Increment failed auth counter
                return res.status(401).json("Unauthorized Access");
            }
            
        } catch (error) {
            failedAuthCounter.inc({ method: req.method, path: req.path }); // Increment failed auth counter
            console.error(`Error occurred: ${error.message}`);
            return res.status(400).json({ error: "Unauthorized Access" });
        }
    };
};

module.exports = authPage;
