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
			dist: "dist",
			build: "build",
			tests: "build/tests",
		},

		copy: {
			src: { expand: true, cwd: 'src/', src: ['**'], dest: 'build/lib/' },
		},

		
		jasmine: {
			tests: {
				src: "tests/specs/*.js",  
				options: {
					specs: "tests/specs.js",
					summary: true,
					keepRunner: true
				}
			}
		},

		watch: {
			scripts: {
				files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
				tasks: ['default'],
				options: {
					interrupt: true,
					event: 'all'
				}
			},
			tests: {
				files: ['src/**/*.js', 'tests/**/*.test.js', 'Gruntfile.js'],
				tasks: ['test'],
				options: {
					interrupt: true,
					event: 'all'
				}
			},
		},

		jsdoc : {
			dist : {
				src: ['README.md', 'src/*.js', 'test/*.js'],
				options: {
					destination: 'doc'
				}
			}
		}

	}); 


	
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jsdoc');

	// default do nothing
	grunt.registerTask('default', ['build', 'watch']);

	grunt.registerTask('test', ['build', 'clean:tests', 'jasmine', 'watch:tests']);
	grunt.registerTask('build', ['clean:dist', 'clean:build', 'copy:src']);

};
