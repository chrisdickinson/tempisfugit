NODE_JS = $(if $(shell test -f /usr/bin/nodejs && echo "true"),nodejs,node)
NODE_LIB_PATH = ~/.node_libraries

BASE = .
INSTALL_PATH = $(NODE_LIB_PATH)/tempis

all: build

update: uninstall install

install:
	@@mkdir -p $(INSTALL_PATH)
	@@mkdir -p $(INSTALL_PATH)/lib
	@@mkdir -p $(INSTALL_PATH)/lib/odb
	@@mkdir -p $(INSTALL_PATH)/lib/types

	@@cp -f -r $(BASE)/lib/* $(INSTALL_PATH)/lib/
	@@cp -f $(BASE)/package.json $(INSTALL_PATH)/

	@@echo "Installed to $(INSTALL_PATH)"

uninstall:
	@@rm -rf $(INSTALL_PATH)
	@@echo "Uninstalled from $(INSTALL_PATH)"

test:
	@@$(NODE_JS) $(BASE)/test/index.js test

lint:
	@@$(NODE_JS) $(BASE)/util/hint-check.js

.PHONY: test
