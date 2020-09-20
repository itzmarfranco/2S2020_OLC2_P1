var Symbol = function(t, ret, id, val, len)
{
    this.model = 'Symbol';
    this.type = t; //function variable 
    this.returnType = ret;
    this.id = id;
    this.value = val;
    this.length = len;
};

var SymbolTable = function()
{
    this.model = 'SymbolTable';
    this.symbols = [];
};

function isSymbolInTable(ts, id)
{
    let exist = false;
    ts.symbols.forEach(sym => {
        if(sym.id == id) 
        {
            exist = true;
        }
    });
    return exist;
}

function getSymbol(ts, id)
{
    let s = null;
    ts.symbols.forEach(sym => {
        if(sym.id == id) s = sym;
    });
    return s;
}

function updateSymbol(id, value)
{
    console.log('updating '+ id + ' = ' + value);
    let index = globalStack.stack.length-1;
    let updated = false;
    let typesMatch = false;
    let voidAssigned = false;
    for(let j = index; j>=0; j--) // symbol tables
    {
        for (let i = 0; i < globalStack.stack[j].symbols.length; i++) // symbols
        {
            if(globalStack.stack[j].symbols[i].id == id)
            {
                let type = globalStack.stack[j].symbols[i].returnType;
                let isNumber = type == 'number' && typeof value == 'number';
                let isString = type == 'string' && typeof value == 'string';
                let isBoolean = type == 'boolean' && typeof value == 'boolean';
                let isNull = type == null;
                if(type != 'void')
                {
                    if(isNumber || isString || isBoolean || isNull)
                    {
                        globalStack.stack[j].symbols[i].value = value;
                        if(isNull) globalStack.stack[j].symbols[i].returnType = typeof value;
                        updated = true;
                        typesMatch = true
                        voidAssigned = false;
                        break;
                    }
                    else
                    {
                        // TYPES DO NOT MATCH
                        updated = false;
                        typesMatch = false;
                        voidAssigned = false;
                    }
                }
                else
                {
                    // TRYING TO ASSIGN TO VOID
                    updated = false;
                    typesMatch = false;
                    voidAssigned = true;
                }
            }
            else continue;
        }
    }
    if(!typesMatch) semanticErrors.push(new Error('Los tipos de '+ id + ' y ' + value + ' no coinciden', 0, 0));
    if(voidAssigned) semanticErrors.push(new Error('No es posible asignar ' + value + ' a variable VOID '+ id));
    return updated;
}

var TsStack = function()
{
    this.model = 'TS Stack';
    this.stack = [];
};
var Error = function(message, row, col)
{
    this.model = 'Error';
    this.message = message;
    this.row = row;
    this.column = col;
};

//var globalTS = new SymbolTable();
var globalStack = new TsStack();
var continueStack = [];
var breakStack = [];

//Error lists
var lexicalErrors = [];
var syntaxErrors = [];
var semanticErrors = [];

function saveGlobal(ast)
{
    // save global variables and outer functions on TS
    globalStack.stack = [];
    let globalTS = new SymbolTable();

    if(ast != null)
    {
        ast.forEach(stm => {
            if(stm.model == 'Function')
            {
                let f = new Symbol('Function', stm.returnType, stm.id, null, 0);
                globalTS.symbols.push(f);
            }
        });
    }
    // push TS to stack
    globalStack.stack.push(globalTS);
}

function execute(ast)
{
    if(ast != null)
    {
        ast.forEach(stm => {
            if(stm.model == 'Function')
            {
                //skip, already added to ts
            }
            else if(stm.model == 'Declaration')
            {
                executeDeclaration(stm);
            }
            else if(stm.model == 'Expression')
            {
                executeExpression(stm);
            }
            else if(stm.model == 'If')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeIf(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'IfElse')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeIfelse(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'While')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeWhile(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'DoWhile')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeDowhile(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'For')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeFor(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'ForOf')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeForOf(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'ForIn')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeForIn(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'Switch')
            {
                let ts = new SymbolTable();
                globalStack.stack.push(ts);
                executeSwitch(stm);
                globalStack.stack.pop();
            }
            else if(stm.model == 'GraficarTS')
            {
                executeGraficarts(stm);
            }
            else if(stm.model == 'ConsoleLog')
            {
                executeConsolelog(stm);
            }
        });
    }
}

function executeExpression(stm)
{
    if(stm.model == 'Number')
    {
        return Number(stm.value);
    }
    else if(stm.model == 'String')
    {
        return String(stm.value);
    }
    else if(stm.model == 'Boolean')
    {
        if(stm.value == 'true') return true;
        else if(stm.value == 'false') return false;
    }
    else if(stm.model == 'Variable')
    {
        // search for variable.id in all ts (top to bottom), return value
        let index = globalStack.stack.length-1;
        for(let i = index; i >= 0; i--)
        {
            if(isSymbolInTable(globalStack.stack[i], stm.id))
            {
                let sym = getSymbol(globalStack.stack[i], stm.id);
                return sym.value;
            }
        }
        let e = new Error('Símbolo \''+stm.id+'\' no existe', 0, 0);
        semanticErrors.push(e);
        return null;
    }
    else
    {
        if(stm.model == 'UnaryOperation')
        {
            let op = stm.operator;
            if(op == '!')
            {
                return !executeExpression(stm.value);
            }
            else if(op == '~')
            {
                return ~executeExpression(stm.value);
            }
            else if(op == '++')
            {
                // update symbol stm.value in TS
                let val = executeExpression(stm.value);
                let updated = false;
                if(typeof val == 'number') updated = updateSymbol(stm.value.id, val+1);
                if(!updated)
                {
                    semanticErrors.push(new Error('No se pudo realizar la operación ++',0, 0));
                    return null;
                }
                return true;
            }
            else if(op == '--')
            {
                // update symbol stm.value in TS
                let val = executeExpression(stm.value);
                let updated = false;
                if(typeof val == 'number') updated = updateSymbol(stm.value.id, val-1);
                if(!updated)
                {
                    semanticErrors.push(new Error('No se pudo realizar la operación --',0, 0));
                    return null;
                }
                return true;
            }
            else if(op == '-')
            {
                return -executeExpression(stm.value);
            }
        }
        else if(stm.model == 'ArithmeticOperation')
        {
            if(stm.operator == '+')      return executeExpression(stm.value1) + executeExpression(stm.value2);
            else if(stm.operator == '-') return executeExpression(stm.value1) - executeExpression(stm.value2);
            else if(stm.operator == '*') return executeExpression(stm.value1) * executeExpression(stm.value2);
            else if(stm.operator == '/') return executeExpression(stm.value1) / executeExpression(stm.value2);
            else if(stm.operator == '%') return executeExpression(stm.value1) % executeExpression(stm.value2);
        }
        else if(stm.model == 'ShiftOperation')
        {
            if(stm.operator == '>>')      return executeExpression(stm.value1) >> executeExpression(stm.value2);
            else if(stm.operator == '<<') return executeExpression(stm.value1) << executeExpression(stm.value2);
        }
        else if(stm.model == 'RelationalOperation')
        {
            if(stm.operator == '<')       return executeExpression(stm.value1) < executeExpression(stm.value2);
            else if(stm.operator == '>')  return executeExpression(stm.value1) > executeExpression(stm.value2);
            else if(stm.operator == '>=') return executeExpression(stm.value1) >= executeExpression(stm.value2);
            else if(stm.operator == '<=') return executeExpression(stm.value1) <= executeExpression(stm.value2);
            else if(stm.operator == '==') return executeExpression(stm.value1) == executeExpression(stm.value2);
            else if(stm.operator == '!=') return executeExpression(stm.value1) != executeExpression(stm.value2);
        }
        else if(stm.model == 'BitwiseOperation')
        {
            if(stm.operator == '|')      return executeExpression(stm.value1) | executeExpression(stm.value2);
            else if(stm.operator == '&') return executeExpression(stm.value1) & executeExpression(stm.value2);
            else if(stm.operator == '^') return executeExpression(stm.value1) ^ executeExpression(stm.value2);
        }
        else if(stm.model == 'LogicalOperation')
        {
            if(stm.operator == '||')      return executeExpression(stm.value1) || executeExpression(stm.value2);
            else if(stm.operator == '&&') return executeExpression(stm.value1) && executeExpression(stm.value2);
        }
        else if(stm.model == 'TernaryOperation')
        {
            if(executeExpression(stm.value1) == true)
            {
                return executeExpression(stm.value2);
            }
            else
            {
                return executeExpression(stm.value3);
            }
        }
        else if(stm.model == 'AssignOperation')
        {
            // value1 = variable. Search for variable in all ts (top to bottom of stack)
            let newValue = executeExpression(stm.value2);
            let updated = updateSymbol(stm.value1.id, newValue);
            if(!updated) semanticErrors.push(new Error('No se pudo actualizar la variable '+stm.value1.id+ ' = '+newValue, 0, 0));
        }
        else if(stm.model == 'Expression')
        {
            return executeExpression(stm.expression);
        }
    }
}

function executeFunction(stm)
{
    console.log('Translating function');
}

function executeDeclaration(stm)
{
    let currentTS = globalStack.stack.pop();
    stm.idList.forEach(dec => {
        // get ts from top of stack and try to save there
        if(isSymbolInTable(currentTS, dec.id) == false)
        {
            let val = null;
            let varType = null;
            if(dec.value != null) val = executeExpression(dec.value);
            if(dec.type == null) varType = typeof val;
            let d = new Symbol('Declaration', varType, dec.id, val, dec.array);
            currentTS.symbols.push(d);
        }
        else
        {
            //error, id already in ts
            let e = new Error('Símbolo \''+dec.id+'\' ya existe en el ámbito actual');
            semanticErrors.push(e);
        }
    });
    globalStack.stack.push(currentTS);
}

function executeIf(stm)
{
    let cond = stm.condition.expression;
    let stms = stm.statements;
    if(executeExpression(cond)) execute(stms);
}

function executeIfelse(stm)
{
    let cond = stm.condition.expression;
    let stmsTrue = stm.statementsTrue;
    let stmsFalse = stm.statementsFalse;
    if(executeExpression(cond)) execute(stmsTrue);
    else execute(stmsFalse);
}

function executeWhile(stm)
{
    let cond = stm.condition.expression;
    let stms = stm.statements;
    while(executeExpression(cond)) execute(stms);
}

function executeDowhile(stm)
{
    let cond = stm.condition.expression;
    let stms = stm.statements;
    do execute(stms); while(executeExpression(cond));
}

function executeFor(stm)
{
    let arg1 = stm.arg1;
    let arg2 = stm.arg2;
    let arg3 = stm.arg3;
    let assignation = execute([arg1]);
    console.log(assignation);
    while(executeExpression(arg2))
    {
        execute(stm.statements);
        executeExpression(arg3);
    }
}

function executeForIn(stm)
{

}

function executeForOf(stm)
{

}

function executeSwitch(stm)
{
    let cond = executeExpression(stm.condition);
    let cases = stm.cases;
    cases.forEach(c => {
        let v2 = executeExpression(c.value);
        let compare =  cond == v2;
        if(compare) execute(c.statements);
    });
    
}

function executeGraficarts(stm)
{

}

function executeConsolelog(stm)
{
    console.log(executeExpression(stm.param));
}