/*******************************************************************************
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 ******************************************************************************/
package io.akera;

import java.io.ByteArrayInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.olingo.client.api.ODataClient;
import org.apache.olingo.client.api.communication.request.retrieve.ODataEntitySetRequest;
import org.apache.olingo.client.api.communication.request.retrieve.ODataServiceDocumentRequest;
import org.apache.olingo.client.api.communication.response.ODataRetrieveResponse;
import org.apache.olingo.client.api.domain.ClientEntity;
import org.apache.olingo.client.api.domain.ClientEntitySet;
import org.apache.olingo.client.api.domain.ClientProperty;
import org.apache.olingo.client.api.domain.ClientServiceDocument;
import org.apache.olingo.client.core.ODataClientFactory;
import org.apache.olingo.commons.api.edm.Edm;
import org.apache.olingo.commons.api.format.ContentType;

/**
 *
 */
public class OdataTest {
	public static void main(String[] paras) throws Exception {

		try {
			String serviceUrl = "http://10.10.10.6:8484/sports/rest/api/odata";

			ODataClient client = ODataClientFactory.getClient();

			ODataServiceDocumentRequest req = client.getRetrieveRequestFactory().getServiceDocumentRequest(serviceUrl);
			req.setFormat(ContentType.APPLICATION_XML);

			ODataRetrieveResponse<ClientServiceDocument> res = req.execute();

			if (res.getStatusCode() == 200) {

				ClientServiceDocument serviceDocument = res.getBody();
				Collection<String> entitySetNames = serviceDocument.getEntitySetNames();

				for (String entity : entitySetNames) {
					System.out.println("Entity: " + entity);
				}

				Map<String, URI> entitySets = serviceDocument.getEntitySets();

				for (Entry<String, URI> entitySet : entitySets.entrySet()) {
					System.out.println(entitySet.getKey());

					if (entitySet.getKey().equalsIgnoreCase("customers")) {
						ODataEntitySetRequest<ClientEntitySet> entityReq = client.getRetrieveRequestFactory()
								.getEntitySetRequest(entitySet.getValue());

						ClientEntitySet set = entityReq.execute().getBody();

						for (ClientEntity row : set.getEntities()) {
							System.out.println("Customer no# " + row.getProperty("CustNum").getValue());

							for (ClientProperty prop : row.getProperties()) {
								if (!prop.getName().equals("CustNum"))
									System.out.println(prop.getName() + " = " + prop.getValue());
							}

							System.out.println("-------------------------------------------");
						}
					}

				}

				Map<String, URI> singletons = serviceDocument.getSingletons();
				Map<String, URI> functionImports = serviceDocument.getFunctionImports();
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}