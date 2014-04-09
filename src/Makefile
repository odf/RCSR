BROWSERIFY=../node_modules/.bin/browserify
BUILD=../public/js

MAKEDEPEND= \
	$(BROWSERIFY) --list app.js | \
		sort | \
		sed "s|^$$PWD/||" | \
		grep -v '^\(\/\|\sapp.js\)' | \
		sed 's/\(.*\)/$$(BUILD)\/app.js: \1\n\1:\n/' > deps.mk

$(BUILD)/app.js:	app.js
	@$(MAKEDEPEND)
	mkdir -p $(BUILD) && \
	$(BROWSERIFY) -t regeneratorify -x React app.js -o $@ || rm -f $@

deps.mk:
	@$(MAKEDEPEND)

-include deps.mk
