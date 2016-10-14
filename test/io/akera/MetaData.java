package io.akera;

import static org.junit.Assert.*;

import java.util.List;

import org.apache.olingo.client.api.ODataClient;
import org.apache.olingo.client.api.communication.request.retrieve.EdmMetadataRequest;
import org.apache.olingo.client.api.communication.response.ODataRetrieveResponse;
import org.apache.olingo.client.core.ODataClientFactory;
import org.apache.olingo.commons.api.edm.Edm;
import org.apache.olingo.commons.api.edm.EdmAction;
import org.apache.olingo.commons.api.edm.EdmElement;
import org.apache.olingo.commons.api.edm.EdmEntityContainer;
import org.apache.olingo.commons.api.edm.EdmEntitySet;
import org.apache.olingo.commons.api.edm.EdmEntityType;
import org.apache.olingo.commons.api.edm.EdmSchema;
import org.junit.Before;
import org.junit.Test;

public class MetaData {

	ODataClient client;
	String serviceRoot = "http://localhost:8383/sports/rest/api/odata";

	@Before
	public void setUp() throws Exception {
		client = ODataClientFactory.getClient();
	}

	@Test
	public void metaData() {

		EdmMetadataRequest request = client.getRetrieveRequestFactory().getMetadataRequest(serviceRoot);
		ODataRetrieveResponse<Edm> response = request.execute();

		assertNotNull(response);

		Edm meta = response.getBody();

		List<EdmSchema> schemas = meta.getSchemas();
		
		assertTrue("Service should have schema(s)", !schemas.isEmpty());
		
		for (EdmSchema schema : schemas) {
			List<EdmEntityType> types = schema.getEntityTypes();
			
			assertTrue("Schema should have types: " + schema.getNamespace(), !types.isEmpty());
			
			for (EdmEntityType type : types) {
				List<String> propNames = type.getPropertyNames();
				assertTrue("Type should have properties: " + type.getFullQualifiedName(), !propNames.isEmpty());
				
				System.out.println("Type : " + type.getFullQualifiedName());

				for (String propName : propNames) {
					EdmElement prop = type.getProperty(propName);
					
					assertNotNull("Property should have name: " + propName, prop.getName());
					assertNotNull("Property should have type: " + propName, prop.getType());
					
					System.out.println("Property : " + prop.getName() + " as " + prop.getType().getFullQualifiedName());
				}
				
			}
			
			List<EdmAction> actions = schema.getActions();
			
			for (EdmAction action : actions) {
				System.out.println("Action : " + action.getName() + " as " + action.getFullQualifiedName());

			}
			
			EdmEntityContainer container = schema.getEntityContainer();
			
			assertNotNull("Schema should have an entity container.", container);
			
			List<EdmEntitySet> sets = container.getEntitySets();
			assertTrue("Container should have entity sets: " + container.getNamespace(), !sets.isEmpty());
			
			for (EdmEntitySet set : sets) {
				System.out.println("Entity set: " + set.getName() + " as " + set.getEntityType().getFullQualifiedName());
			}
			
		}
	}

}
