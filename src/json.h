#pragma once

#include <variant>
#include <string>
#include <string_view>
#include <vector>
#include <unordered_map>
#include <charconv>
#include <exception>
#include <cctype>
#include <iostream>

class JSON {
public:
    // alias types
    using array  = std::vector<JSON>;
    using object = std::unordered_map<std::string, JSON>;
    using value_t = std::variant<
        std::nullptr_t,
        bool,
        double,
        std::string,
        array,
        object
    >;

private:
    value_t _value;

    // for skipping whitespace
    static constexpr std::string_view _ws = " \n\r\t";

    // forward declare parser
    struct Parser;

public:
    // CTORS
    JSON()                 : _value(nullptr) {}
    JSON(std::nullptr_t)   : _value(nullptr) {}
    JSON(bool b)           : _value(b) {}
    JSON(double d)         : _value(d) {}
    JSON(std::string  s)   : _value(std::move(s)) {}
    JSON(const char* s)    : _value(std::string(s)) {}
    JSON(array a)          : _value(std::move(a)) {}
    JSON(object o)         : _value(std::move(o)) {}

    // parse entrypoint
    static JSON parse(std::string_view txt) {
        Parser p(txt);
        JSON j = p.parse();
        p.skip();
        if (p.pos() != txt.size())
            throw std::runtime_error("Extra data after JSON value");
        return j;
    }

    // type queries
    bool is_null()   const { return std::holds_alternative<std::nullptr_t>(_value); }
    bool is_bool()   const { return std::holds_alternative<bool>(_value); }
    bool is_number() const { return std::holds_alternative<double>(_value); }
    bool is_string() const { return std::holds_alternative<std::string>(_value); }
    bool is_array()  const { return std::holds_alternative<array>(_value); }
    bool is_object() const { return std::holds_alternative<object>(_value); }

    // direct getters (throws if wrong type)
    template<typename T>
    T&       get()       { return std::get<T>(_value); }

    template<typename T>
    const T& get() const { return std::get<T>(_value); }

    // operator[] for arrays
    JSON&       operator[](size_t idx) {
        if (!is_array())  throw std::runtime_error("Not an array");
        auto& a = get<array>();
        if (idx >= a.size()) throw std::runtime_error("Index out of range");
        return a[idx];
    }
    const JSON& operator[](size_t idx) const {
        if (!is_array())  throw std::runtime_error("Not an array");
        auto& a = get<array>();
        if (idx >= a.size()) throw std::runtime_error("Index out of range");
        return a[idx];
    }

    // operator[] for objects (inserts on non-const)
    JSON&       operator[](const std::string& key) {
        if (!is_object()) {
            throw std::runtime_error("Not an object");
        }
        return get<object>()[key];
    }
    const JSON& operator[](const std::string& key) const {
        if (!is_object())  throw std::runtime_error("Not an object");
        auto& o = get<object>();
        auto it = o.find(key);
        if (it == o.end())
            throw std::runtime_error("Key '" + key + "' not found");
        return it->second;
    }

    // pretty-print
    friend std::ostream& operator<<(std::ostream& os, const JSON& j) {
        j._print(os, 0);
        return os;
    }

private:
    // internal print
    void _print(std::ostream& os, int indent) const {
        auto pad = [&](int n){ while(n-->0) os.put(' '); };
        std::visit([&](auto&& v){
            using T = std::decay_t<decltype(v)>;
            if constexpr(std::is_same_v<T,std::nullptr_t>) {
                os << "null";
            } else if constexpr(std::is_same_v<T,bool>) {
                os << (v ? "true" : "false");
            } else if constexpr(std::is_same_v<T,double>) {
                os << v;
            } else if constexpr(std::is_same_v<T,std::string>) {
                os << '"' << v << '"';
            } else if constexpr(std::is_same_v<T,array>) {
                os << "[\n";
                for (size_t i = 0; i < v.size(); ++i) {
                    pad(indent+2);
                    v[i]._print(os, indent+2);
                    if (i+1 < v.size()) os << ',';
                    os << '\n';
                }
                pad(indent);
                os << ']';
            } else { // object
                os << "{\n";
                size_t c = 0, sz = v.size();
                for (auto& [k,val] : v) {
                    pad(indent+2);
                    os << '"' << k << "\": ";
                    val._print(os, indent+2);
                    if (++c < sz) os << ',';
                    os << '\n';
                }
                pad(indent);
                os << '}';
            }
        }, _value);
    }

    // Parser definition
    struct Parser {
        std::string_view s;
        size_t           p = 0;
        Parser(std::string_view txt): s(txt){}
        size_t pos() const { return p; }
        void skip() {
            while (p < s.size() && _ws.find(s[p]) != std::string_view::npos) ++p;
        }

        JSON parse() {
            skip();
            if (p >= s.size()) throw std::runtime_error("Empty input");
            return parse_value();
        }

        JSON parse_value() {
            skip();
            if (p >= s.size()) throw std::runtime_error("Unexpected EOF");
            switch (s[p]) {
                case 'n': return parse_literal("null", JSON(nullptr));
                case 't': return parse_literal("true", JSON(true));
                case 'f': return parse_literal("false", JSON(false));
                case '"': return parse_string();
                case '[': return parse_array();
                case '{': return parse_object();
                default:
                    if (s[p]=='-' || std::isdigit((unsigned char)s[p]))
                        return parse_number();
                    throw std::runtime_error(std::string("Unexpected '") + s[p] + "'");
            }
        }

        JSON parse_literal(std::string_view lit, JSON rep) {
            if (s.substr(p, lit.size()) != lit)
                throw std::runtime_error("Invalid literal");
            p += lit.size();
            return rep;
        }

        JSON parse_string() {
            ++p;            // skip "
            std::string out;
            while (p < s.size()) {
                char c = s[p++];
                if (c == '"') break;
                if (c == '\\') {
                    if (p >= s.size()) throw std::runtime_error("Bad escape");
                    char e = s[p++];
                    switch (e) {
                        case '"': out += '"'; break;
                        case '\\':out += '\\';break;
                        case '/': out += '/'; break;
                        case 'b': out += '\b';break;
                        case 'f': out += '\f';break;
                        case 'n': out += '\n';break;
                        case 'r': out += '\r';break;
                        case 't': out += '\t';break;
                        default:  throw std::runtime_error("Unknown escape");
                    }
                } else {
                    out += c;
                }
            }
            return JSON(std::move(out));
        }

        JSON parse_number() {
            size_t start = p;
            if (s[p] == '-') ++p;
            auto isdig = [&](char ch){ return ch >= '0' && ch <= '9'; };
            if (p < s.size() && isdig(s[p])) {
                while (p < s.size() && isdig(s[p])) ++p;
                if (p < s.size() && s[p] == '.') {
                    ++p;
                    if (p >= s.size() || !isdig(s[p]))
                        throw std::runtime_error("Bad number");
                    while (p < s.size() && isdig(s[p])) ++p;
                }
                if (p < s.size() && (s[p]=='e'||s[p]=='E')) {
                    ++p;
                    if (p < s.size() && (s[p]=='+'||s[p]=='-')) ++p;
                    if (p >= s.size() || !isdig(s[p]))
                        throw std::runtime_error("Bad exponent");
                    while (p < s.size() && isdig(s[p])) ++p;
                }
                double val;
                auto res = std::from_chars(
                    s.data()+start, s.data()+p, val
                );
                if (res.ec != std::errc())
                    throw std::runtime_error("Number parsing failed");
                return JSON(val);
            }
            throw std::runtime_error("Invalid number");
        }

        JSON parse_array() {
            ++p; skip();
            array arr;
            if (p < s.size() && s[p] == ']') { ++p; return JSON(arr); }
            while (true) {
                arr.push_back(parse_value());
                skip();
                if (p < s.size() && s[p] == ',') { ++p; skip(); continue; }
                if (p < s.size() && s[p] == ']') { ++p; break; }
                throw std::runtime_error("Bad array");
            }
            return JSON(std::move(arr));
        }

        JSON parse_object() {
            ++p; skip();
            object obj;
            if (p < s.size() && s[p] == '}') { ++p; return JSON(obj); }
            while (true) {
                if (p >= s.size() || s[p] != '"')
                    throw std::runtime_error("Object key must start with '\"'");
                JSON key = parse_string();
                skip();
                if (p >= s.size() || s[p++] != ':')
                    throw std::runtime_error("Expected ':' after key");
                skip();
                JSON val = parse_value();
                skip();
                obj.emplace(std::move(key.get<std::string>()), std::move(val));
                if (p < s.size() && s[p] == ',') { ++p; skip(); continue; }
                if (p < s.size() && s[p] == '}') { ++p; break; }
                throw std::runtime_error("Bad object");
            }
            return JSON(std::move(obj));
        }
    };
};
