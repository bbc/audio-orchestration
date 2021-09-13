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
                    { expand: true, cwd: "node_modules/video.js/dist", src: ["*.css"], dest: "www/css/" },
                    { expand: true, cwd: "node_modules/qrcodejs", src: ["qrcode.js"], dest: "www/js/" },
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

        watch: {
            scripts: {
                files: [
                    "src/**/*",
                    "../../dist/browser/CloudSyncKit.js",
                    "Gruntfile.js",
                    "config.js"
                ],
                tasks: [ "build", "express:run" ],
                options: {
                    interrupt: true,
                    event: "all",
                    spawn: false
                }
            }
        },

        express: {
            run: {
                options: {
                    port: 3000,
                    script: "./server.js"
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-webpack");
    grunt.loadNpmTasks("grunt-express-server");

    grunt.registerTask("build", [ "clean", "copy", "webpack"]);
    grunt.registerTask("default", ["build"]);
};
    