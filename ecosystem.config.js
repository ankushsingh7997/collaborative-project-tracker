module.exports = {
    apps: [
        {
            name: "project-tracker-backend-cluster-1",
            script: "./server.js",
            instances: 1,
            exec_mode: "cluster",
            restart_delay: 1000,
            env_local: {
                NODE_ENV: "local",
                ID: 1,
            },
            env_development: {
                NODE_ENV: "development",
                ID: 1,
            },
            env_production: {
                NODE_ENV: "production",
                ID: 1,
            },
            watch: true,
            ignore_watch: ["node_modules", "Logs", ".git"], // Ensure the correct capitalization of folder
            log_file: "./Logs/cluster-1/combined.log",
            out_file: "./Logs/cluster-1/out.log",
            error_file: "./Logs/cluster-1/error.log",
        },
    ],
};
