.PHONY: entry
entry:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: database
database:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: query-session
query-session:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: cookie-session
cookie-session:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: common-session
common-session:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: http-auth-session
http-auth-session:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: rs256key
rs256key:
	bash genRS256Key.sh

.PHONY: resource
resource:
	docker-compose build $@ && docker-compose up -d $@

.PHONY: jwt-session
jwt-session: resource rs256key
	docker-compose build $@ && docker-compose up -d $@
