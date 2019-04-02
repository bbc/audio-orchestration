/****************************************************************************
 * Copyright 2015 British Broadcasting Corporation
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ****************************************************************************/

// create a context containing all the files in the specs folder
// http://webpack.github.io/docs/context.html

var req_specs = require.context("./specs", true, /.*/)

// now require all the files contained in this context

req_specs.keys().forEach(function(key) {
	req_specs(key);
})
