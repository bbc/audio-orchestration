/****************************************************************************
 * Copyright 2016 British Broadcasting Corporation
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/
var path = require("path"),
	libRoot = [],
	testRoot = [];

// Paths to source files for library builds
libRoot.push(path.resolve("../common"));
libRoot.push(path.resolve("../common/message"));
libRoot.push(path.resolve("../common/message/impl"));
libRoot.push(path.resolve("../common/messenger"));
libRoot.push(path.resolve("../common/topicparser"));
libRoot.push(path.resolve("../common/util"));
libRoot.push(path.resolve("../common/timeline"));
libRoot.push(path.resolve("../common/datastore"));
libRoot.push(path.resolve("../common/state"));
libRoot.push(path.resolve("../synccontroller"));

// Paths to source files for test builds
testRoot.push(path.resolve("tests/specs"));
testRoot.push(path.resolve("tests/mocks"));
testRoot = testRoot.concat(libRoot);

module.exports = function(grunt) {

	grunt.initConfig({

		clean: {
			dist: "dist",
			build: "build",
			tests: "build/tests",
			tmp: "build/tmp"
		},

		webpack: {
			messageFactoryNode: {
				entry: "../common/message/MessageFactory.js",
				output: {
					path: path.resolve("./build/lib"),
					filename: "MessageFactory.js",
					chunkFilename: "chunk-[name]-[chunkhash].js",
					library: "MessageFactory",
					libraryTarget: "commonjs2"
				},
				module: {
					loaders: []
				},
				resolve: {
					root: libRoot
				}
			},

			messengerNode: {
				entry: "../common/messenger/Messenger.js",
				output: {
					path: path.resolve("./build/lib"),
					filename: "Messenger.js",
					chunkFilename: "chunk-[name]-[chunkhash].js",
					library: "Messenger",
					libraryTarget: "commonjs2"
				},
				module: {
					loaders: []
				},
				resolve: {
					root: libRoot
				}
			},

			specs: {
				entry: "./tests/main.js",
				output: {
					path: path.resolve("build/tests/"),
					filename: "specs.js",
					chunkFilename: "chunk-[name]-[chunkhash].js"
				},
				module: {
					loaders: []
				},
				resolve: {
					root: testRoot
				}
			}
		},

		jasmine: {
			tests: {
				src: [],  // not needed because each test uses require() to load what it is testing
				options: {
					specs: "build/tests/specs.js",
					outfile: "build/tests/_specRunner.html",
					summary: true,
					keepRunner: true
				}
			}
		},

		watch: {
			scripts: {
				files: [
					"../common/**/*.js",
					"../common/datastore/**/*.js", 
					"../common/state/**/*.js", 
					"../synccontroller/**/*.js", 
					"Gruntfile.js"
				],
				// Do not call watch here (e.g. do not call 'default').
				// Otherwise there will be two (three, four, ...) watch tasks running
				// after first (second, third ...) invokation of watch!
				// Consequently all attached tasks will be executed two (three, four, ...) times.
				tasks: ["build_lib"],
				options: {
					interrupt: true,
					event: "all"
				}
			},
			tests: {
				files: ["src/**/*.js", "tests/**/*.test.js", "Gruntfile.js"],
				tasks: ["build_tests"],
				options: {
					interrupt: true,
					event: "all"
				}
			},
		}

	});


	grunt.loadNpmTasks("grunt-webpack");
	grunt.loadNpmTasks("grunt-contrib-jasmine");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");


	// default do nothing
	grunt.registerTask("default", ["build_lib", "watch:scripts"]);
	grunt.registerTask("test", ["build_tests", "watch:tests"]);

	grunt.registerTask("build_tests", ["build_lib", "clean:tests", "webpack:specs", "jasmine:tests"]);
	grunt.registerTask("build_lib", ["clean:build", "webpack:messageFactoryNode", "webpack:messengerNode", "clean:tmp" ]);


};
