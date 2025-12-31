document.addEventListener("DOMContentLoaded", () => {
    const setAsEmployeeCheckbox = document.getElementById("setasemployee");

    // Array of container IDs for employee fields
    const employeeFieldContainers = [
        "designationDiv",
        "departmentDiv",
        "reportingManagerDiv"
    ].map(id => document.getElementById(id));

    // Toggle visibility and required attribute for employee-related fields
    const toggleEmployeeFields = (isVisible) => {
        employeeFieldContainers.forEach(container => {
            if (container) {
                container.style.display = isVisible ? "block" : "none";

                // Update the 'required' attribute for the input/select field
                const field = container.querySelector("input, select");
                if (field) {
                    field.required = isVisible;
                }
            }
        });
    };

    if (setAsEmployeeCheckbox) {
        // Initialize visibility and required attribute based on the checkbox's initial state
        toggleEmployeeFields(setAsEmployeeCheckbox.checked);
    
        // Add event listener to update fields dynamically on checkbox state change
        setAsEmployeeCheckbox.addEventListener("change", () => {
            toggleEmployeeFields(setAsEmployeeCheckbox.checked);
        });
    }
});

// USECASE1:FORCREATE:
// <div class="col-12 col-md-4 mb-1" id="designationDiv" style="display: none;">
//                                             <label class="form-label" for="designation">Designation</label>
//                                             <input type="text" class="form-control" id="designation" name="designation" />
//                                         </div>
//                                         <div class="col-12 col-md-4 mb-1" id="departmentDiv" style="display: none;">
//                                             <label class="form-label" for="department">Department</label>
//                                             <input type="text" class="form-control" id="department" name="department" />
//                                         </div>
//                                         <div class="col-12 col-md-4 mb-1" id="reportingManagerDiv" style="display: none;">
//                                             <label class="form-label" for="reporting_manager">Reporting Manager</label>
//                                             <select class="form-select" id="reporting_manager" name="reporting_manager">
//                                                 <option value="" hidden selected>Select an option</option>
//                                                 {% for employee in employees %}                                                  
//                                                 <option value="{{employee.id}}">{{employee.name|title}} [{{employee.email}}]</option>                                                    
//                                                 {% endfor %}
//                                             </select>
//                                         </div>


// USECASE2:FORUPATE:
// <div class="col-12 col-md-4 mb-1" id="designationDiv" style="display: none;">
//                                             <label class="form-label" for="designation">Designation</label>
//                                             <input type="text" class="form-control" id="designation" name="designation" value="{{employee_obj.designation}}" />
//                                         </div>
//                                         <div class="col-12 col-md-4 mb-1" id="departmentDiv" style="display: none;">
//                                             <label class="form-label" for="department">Department</label>
//                                             <input type="text" class="form-control" id="department" name="department" value="{{employee_obj.department}}" />
//                                         </div>
//                                         <div class="col-12 col-md-4 mb-1" id="reportingManagerDiv" style="display: none;">
//                                             <label class="form-label" for="reporting_manager">Reporting Manager</label>
//                                             <select class="form-select" id="reporting_manager" name="reporting_manager">
//                                                 <option value="" hidden selected>Select an option</option>
//                                                 {% for employee in employees %}                                                  
//                                                 <option value="{{employee.id}}" {% if employee.id == employee_obj.reporting_manager.id %} selected {% endif %}>{{employee.name|title}} [{{employee.email}}]</option>                                                    
//                                                 {% endfor %}
//                                             </select>
//                                         </div>