
/****************************************************************************
 * Copyright 2017 Institut für Rundfunktechnik
 * and contributions Copyright 2017 British Broadcasting Corporation.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * --------------------------------------------------------------------------
 * Summary of parts containing contributions
 *   by British Broadcasting Corporation (BBC):
 *     ControlTimestamp.prototype.toJson
*****************************************************************************/


var RedisSMQConfig = function(redisHost, redisPort, monitorHost, monitorPort) {

	this.redisHost = redisHost;
	this.redisPort = redisPort;
	if (typeof monitorHost !== "undefined")
	{
		this.monitorHost = monitorHost;
		this.monitorPort = monitorPort;
		this.monitorEnabled = true;
	}else
	{
		this.monitorEnabled = false;
	}
};
  
/**
   * @return a config object
   */
RedisSMQConfig.prototype.getConfig = function () {

	
	var config = {
		redis: {
			host: this.redisHost,
			port: this.redisPort
		},
		log: {
			enabled: 0,
			options: {
				level: "trace"
			},
		},
		monitor: {
			enabled: true,
			host: this.monitorHost,
			port: this.monitorPort
		},
	};

	return config;
};

  
  
module.exports = RedisSMQConfig;
  