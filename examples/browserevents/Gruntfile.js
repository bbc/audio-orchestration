var path = require("path");

module.exports = function(grunt) {
    
    grunt.initConfig({

        clean: {
			build: "build"
        },
        
        copy: {
            main: {
                files: [
                    { expand: true, cwd: "node_modules/purecss/build", src: ["*.css"], dest: "www/css/" },
                    { expand: true, cwd: "src/css", src: ["*.css"], dest: "www/css/" },
                    { expand: true, cwd: "src", src: ["*.html"], dest: "www/" },
                ]
            }
        },

        webpack: {
            main: {
                context: path.resolve("src/js"),
                entry: {
                    "index" : ["./index.js"]
                },
                output: {
                    path: path.resolve("www/js"),
                    filename: "[name].js",
                    libraryTarget: "var"
                },
                resolve: { 
                    modules: [
                        path.resolve("src/js"),
                        "node_modules"
                    ] 
                },
            }
        },

        connect: {
            server: {
                options: {
                    hostname: "0.0.0.0",
                    base: [ "www", "media" ],
                    port: 8446,
                    useAvailablePort: true
                }
            }
        },

        watch: {
            scripts: {
                files: [
                    "src/**/*",
                    "../../dist/browser/CloudSyncKit.js",
                    "Gruntfile.js",
                    "config.js"

                ],
                tasks: [ "build" ],
                options: {
                    interrupt: true,
                    event: "all"
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-webpack");

    grunt.registerTask("build", [ "clean", "copy", "webpack"]);
    grunt.registerTask("default", ["build", "connect", "watch"]);
};
    