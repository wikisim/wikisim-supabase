
ALTER TABLE data_components
ADD COLUMN subject_id INTEGER, -- Optional field to link to a subject data component
ADD COLUMN according_to_id INTEGER, -- Optional field to link to an "according to" data component
ADD CONSTRAINT data_components_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES data_components(id),
ADD CONSTRAINT data_components_according_to_id_fkey
    FOREIGN KEY (according_to_id) REFERENCES data_components(id);


ALTER TABLE data_components_history
ADD COLUMN subject_id INTEGER, -- Optional field to link to a subject data component
ADD COLUMN according_to_id INTEGER, -- Optional field to link to an "according to" data component
ADD CONSTRAINT data_components_history_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES data_components(id),
ADD CONSTRAINT data_components_history_according_to_id_fkey
    FOREIGN KEY (according_to_id) REFERENCES data_components(id);



DROP TYPE public.data_component_insert_params CASCADE;
DROP TYPE public.data_component_update_params CASCADE;
