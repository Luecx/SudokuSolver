#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <memory>
#include <iostream>
#include <sstream>
#include <functional>
#include <stdexcept>

class ArgParser {
public:
    struct Option {
        std::string name;
        std::string desc;
        Option(std::string n, std::string d = "") : name(std::move(n)), desc(std::move(d)) {}
    };

    struct Command {
        std::string name;
        std::vector<const Option*> required;
        std::vector<const Option*> optional;
        std::function<void(ArgParser&)> callback;

        Command(std::string n, std::function<void(ArgParser&)> cb = {})
            : name(std::move(n)), callback(std::move(cb)) {}
    };

    const Option& add_option(const std::string& name, const std::string& desc = "") {
        if (options.count(name)) throw std::runtime_error("Option already declared: --" + name);
        return *(options[name] = std::make_unique<Option>(name, desc)).get();
    }

    Command& add_command(const std::string& name, std::function<void(ArgParser&)> callback = {}) {
        if (commands.count(name)) throw std::runtime_error("Command already declared: " + name);
        return *(commands[name] = std::make_unique<Command>(name, std::move(callback))).get();
    }

    Command& add_required(Command& cmd, const Option& opt) {
        cmd.required.push_back(&opt);
        return cmd;
    }

    Command& add_optional(Command& cmd, const Option& opt) {
        cmd.optional.push_back(&opt);
        return cmd;
    }

    void parse(const std::string& commandline) {
        std::istringstream iss(commandline);
        std::vector<std::string> tokens;
        std::string token;
        while (iss >> token) tokens.push_back(token);

        if (tokens.empty()) throw std::runtime_error("No command provided.");
        active_command = tokens[0];

        if (!commands.count(active_command))
            throw std::runtime_error("Unknown command: " + active_command);

        for (size_t i = 1; i < tokens.size(); ++i) {
            const std::string& arg = tokens[i];
            if (arg.rfind("--", 0) == 0) {
                auto eq = arg.find('=');
                std::string key = arg.substr(2, eq - 2);

                std::string val;
                if (eq != std::string::npos) {
                    val = arg.substr(eq + 1);
                } else if (i + 1 < tokens.size() && tokens[i + 1].rfind("--", 0) != 0) {
                    val = tokens[++i];
                } else {
                    val = "1";  // for flags like --smart
                }

                parsed_values[key] = val;
            }
        }

        const auto& cmd = *commands.at(active_command);
        for (const auto* opt : cmd.required) {
            if (!parsed_values.count(opt->name))
                throw std::runtime_error("Missing required argument --" + opt->name + " for command " + cmd.name);
        }
    }

    void run() {
        if (!commands.count(active_command))
            throw std::runtime_error("No valid command selected.");
        if (!commands[active_command]->callback)
            throw std::runtime_error("No callback defined for command: " + active_command);
        commands[active_command]->callback(*this);
    }

    template<typename T>
    T get(const std::string& key, T default_value = T{}) const {
        auto it = parsed_values.find(key);
        if (it == parsed_values.end()) return default_value;
        return convert<T>(it->second);
    }

    template<typename T>
    T require(const std::string& key) const {
        auto it = parsed_values.find(key);
        if (it == parsed_values.end()) throw std::runtime_error("Missing required argument --" + key);
        return convert<T>(it->second);
    }

    void print_help(const std::string& program_name) const {
        std::cout << "Usage:\n";
        for (const auto& [name, cmd_ptr] : commands) {
            const auto& cmd = *cmd_ptr;
            std::cout << "  " << program_name << " " << cmd.name;
            for (const auto* r : cmd.required) std::cout << " --" << r->name << "=<...>";
            for (const auto* o : cmd.optional) std::cout << " [--" << o->name << "=<...>]";
            std::cout << "\n";
        }
    }

private:
    std::unordered_map<std::string, std::unique_ptr<Option>> options;
    std::unordered_map<std::string, std::unique_ptr<Command>> commands;
    std::unordered_map<std::string, std::string> parsed_values;

    std::string active_command;

    template<typename T>
    T convert(const std::string& s) const;

    template<>
    int convert<int>(const std::string& s) const { return std::stoi(s); }

    template<>
    bool convert<bool>(const std::string& s) const {
        return s == "1" || s == "true" || s == "yes";
    }

    template<>
    std::string convert<std::string>(const std::string& s) const { return s; }
};
