/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

module.exports = function(grunt) {

	grunt.initConfig({

		clean: {
			build: "build"
		},

		copy: {
			www: {
				expand: true,
				cwd: 'src/www/',
				src: ['**'],
				dest: 'build/'
			},
		},

	    webpack: {
	      "wcsclient": {
	        context: __dirname + "/src/js",
	        entry: {
	          'wcsclient' : ['./wcsclient.js']
	        },
	        output: {
	          path: __dirname + "/build",
	          filename: "[name].js",
	          chunkFilename: "chunk-[name]-[chunkhash].js",
	          library: 'wcsclient',
	          libraryTarget: 'umd'
	        },
	        resolve: { root: __dirname + "/src/js" },
	      }
	  },

		connect: {
			server: {
				options: {
					hostname: '0.0.0.0',
					base: ['build', 'media'],
					port: 8123,
					useAvailablePort: true
				}
			}
		},

		watch: {
			scripts: {
				files: [
					'src/**/*',
					'Gruntfile.js'
				],
				tasks: ['build','watch'],
				options: {
				interrupt: true,
				event: 'all'
				}
			}
		}
	});
	
	

	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
  	grunt.loadNpmTasks('grunt-contrib-watch');
  	grunt.loadNpmTasks('grunt-webpack');

	grunt.registerTask('build', ['clean', 'copy:www', 'webpack:wcsclient']);
	grunt.registerTask('default', ['build', 'connect', 'watch']);
};