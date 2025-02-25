# These commands run the unit tests for the microservices
run-search-ms-tests:
	@pytest -s testing/TestSearchMS.py
run-cart-ms-tests:
	@pytest -s testing/TestCartMS.py
run-profile-ms-tests:
	@pytest -s testing/TestProfileMS.py

# These commands run the API testing suites
run-search-api-tests:
	@pytest -s testing/TestSearchEndpoints.py
run-cart-api-tests:
	@pytest -s testing/TestCartEndpoints.py
run-profile-api-tests:
	@pytest -s testing/TestProfileEndpoints.py

# runs a unit test coverage check over all microservices
run-unit-coverage:
	@pytest --cov=Microservices testing/TestSearchMS.py testing/TestCartMS.py testing/TestProfileMS.py