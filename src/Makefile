BIN=../node_modules/.bin
BUILD=../public/js

MAKEDEPEND= \
	$(BIN)/browserify --list app.js | \
		sort | \
		sed "s|^$$PWD/||" | \
		grep -v '^\(\/\|\sapp.js\)' | \
		sed 's/\(.*\)/$$(BUILD)\/app.js: \1\n\1:\n/' > deps.mk

$(BUILD)/app.js:	app.js
	@$(MAKEDEPEND)
	$(BIN)/browserify -t regeneratorify -x React app.js -o $@ || rm $@

deps.mk:
	@$(MAKEDEPEND)

-include deps.mk
